from fastapi import FastAPI, UploadFile, File, HTTPException, Request, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
import os
import json
import asyncio
import hashlib
import secrets
from datetime import datetime
from pathlib import Path
from stock_service import (
    CONCEPT_SECTIONS,
    DEFAULT_STOCK_PREFERENCES,
    merge_preferences,
    run_stock_scan,
)

app = FastAPI(title="Image2Video - 图片转视频工具")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).parent
UPLOAD_DIR = BASE_DIR / "uploads"
VIDEO_DIR = BASE_DIR / "videos"
DATA_FILE = BASE_DIR / "data.json"
USERS_FILE = BASE_DIR / "users.json"
SESSIONS = {}

UPLOAD_DIR.mkdir(exist_ok=True)
VIDEO_DIR.mkdir(exist_ok=True)


def load_data():
    if DATA_FILE.exists():
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            data.setdefault("images", [])
            data.setdefault("videos", [])
            data.setdefault("transactions", [])
            data.setdefault("stock_preferences", {})
            data.setdefault("stock_scans", {})
            return data
    return {
        "images": [],
        "videos": [],
        "transactions": [],
        "stock_preferences": {},
        "stock_scans": {},
    }


def save_data(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def load_users():
    if USERS_FILE.exists():
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            data.setdefault("users", [])
            return data
    return {"users": []}


def save_users(data):
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def public_user(user: dict) -> dict:
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "created_at": user["created_at"],
    }


def create_session(user: dict) -> str:
    token = secrets.token_hex(24)
    SESSIONS[token] = public_user(user)
    return token


def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")

    token = authorization.split(" ", 1)[1].strip()
    user = SESSIONS.get(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user


def list_user_images(data: dict, user_id: str) -> List[dict]:
    return [img for img in data["images"] if img.get("user_id") == user_id]


def list_user_videos(data: dict, user_id: str) -> List[dict]:
    return [video for video in data["videos"] if video.get("user_id") == user_id]


def list_user_transactions(data: dict, user_id: str) -> List[dict]:
    return [item for item in data["transactions"] if item.get("user_id") == user_id]


def seed_demo_transactions(user_id: str):
    data = load_data()
    if list_user_transactions(data, user_id):
        return

    samples = [
        ("项目预付款", 8600, "income", "客户回款", "品牌短视频项目"),
        ("办公软件订阅", 199, "expense", "软件订阅", "团队月度工具费用"),
        ("云渲染服务", 428, "expense", "云服务", "视频生成 GPU 资源"),
        ("素材采购", 320, "expense", "素材采购", "商业图片授权"),
        ("客户尾款", 12400, "income", "客户回款", "交付后结算"),
    ]

    for index, item in enumerate(samples):
        title, amount, tx_type, category, note = item
        data["transactions"].append(
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "title": title,
                "amount": amount,
                "type": tx_type,
                "category": category,
                "note": note,
                "occurred_at": datetime.now().replace(day=max(1, 5 + index)).date().isoformat(),
                "created_at": datetime.now().isoformat(),
            }
        )

    save_data(data)


class SubtitleItem(BaseModel):
    image_id: str
    text: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class VideoGenerateRequest(BaseModel):
    image_ids: List[str]
    duration_per_image: float = 3.0
    transition: str = "none"
    subtitles: Optional[List[SubtitleItem]] = None
    font_size: int = 40
    font_color: str = "#FFFFFF"
    subtitle_position: str = "bottom"
    subtitle_style: str = "stroke"
    video_width: int = 1280
    video_height: int = 720
    fps: int = 24


class TransactionCreateRequest(BaseModel):
    title: str
    amount: float = Field(gt=0)
    type: str
    category: str
    note: str = ""
    occurred_at: str


class StockPreferenceUpdateRequest(BaseModel):
    min_price: float = Field(default=DEFAULT_STOCK_PREFERENCES["min_price"], ge=0)
    max_price: float = Field(default=DEFAULT_STOCK_PREFERENCES["max_price"], gt=0)
    recommendation_count: int = Field(
        default=DEFAULT_STOCK_PREFERENCES["recommendation_count"], ge=1, le=20
    )
    max_pe_ttm: float = Field(default=DEFAULT_STOCK_PREFERENCES["max_pe_ttm"], gt=0)
    max_pb: float = Field(default=DEFAULT_STOCK_PREFERENCES["max_pb"], gt=0)
    min_turnover_rate: float = Field(
        default=DEFAULT_STOCK_PREFERENCES["min_turnover_rate"], ge=0
    )
    min_amount_million: float = Field(
        default=DEFAULT_STOCK_PREFERENCES["min_amount_million"], ge=0
    )
    refresh_daily: bool = True


def ensure_stock_profile(data: dict, user_id: str):
    prefs = data["stock_preferences"].get(user_id)
    if not prefs:
        prefs = dict(DEFAULT_STOCK_PREFERENCES)
        data["stock_preferences"][user_id] = prefs
    else:
        data["stock_preferences"][user_id] = merge_preferences(prefs)
        prefs = data["stock_preferences"][user_id]
    return prefs


def ensure_latest_stock_scan(data: dict, user_id: str):
    preferences = ensure_stock_profile(data, user_id)
    latest_scan = data["stock_scans"].get(user_id)
    today = datetime.now().date().isoformat()
    should_refresh = not latest_scan
    if latest_scan and preferences.get("refresh_daily", True):
        should_refresh = latest_scan.get("generated_date") != today

    if should_refresh:
        latest_scan = run_stock_scan(preferences)
        data["stock_scans"][user_id] = latest_scan
        save_data(data)
    return latest_scan


@app.post("/api/auth/register")
async def register(payload: RegisterRequest):
    name = payload.name.strip()
    email = payload.email.strip().lower()
    password = payload.password.strip()

    if len(name) < 2:
        raise HTTPException(status_code=400, detail="Name is too short")
    if "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    user_data = load_users()
    existing = next((u for u in user_data["users"] if u["email"] == email), None)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = {
        "id": str(uuid.uuid4()),
        "name": name,
        "email": email,
        "password_hash": hash_password(password),
        "created_at": datetime.now().isoformat(),
    }
    user_data["users"].append(user)
    save_users(user_data)
    seed_demo_transactions(user["id"])

    token = create_session(user)
    return {"token": token, "user": public_user(user)}


@app.post("/api/auth/login")
async def login(payload: LoginRequest):
    email = payload.email.strip().lower()
    password_hash = hash_password(payload.password)

    user_data = load_users()
    user = next(
        (
            u
            for u in user_data["users"]
            if u["email"] == email and u["password_hash"] == password_hash
        ),
        None,
    )
    if not user:
        raise HTTPException(status_code=401, detail="Email or password is incorrect")

    seed_demo_transactions(user["id"])
    token = create_session(user)
    return {"token": token, "user": public_user(user)}


@app.get("/api/auth/me")
async def me(authorization: Optional[str] = Header(None)):
    return {"user": get_current_user(authorization)}


@app.post("/api/upload")
async def upload_images(
    files: List[UploadFile] = File(...), user: dict = Depends(get_current_user)
):
    data = load_data()
    uploaded = []

    for file in files:
        if not file.content_type or not file.content_type.startswith("image/"):
            continue

        ext = os.path.splitext(file.filename or "img.png")[1]
        image_id = str(uuid.uuid4())
        filename = f"{image_id}{ext}"
        filepath = UPLOAD_DIR / filename

        content = await file.read()
        with open(filepath, "wb") as f:
            f.write(content)

        image_info = {
            "id": image_id,
            "user_id": user["id"],
            "filename": file.filename,
            "stored_name": filename,
            "upload_time": datetime.now().isoformat(),
            "size": len(content),
        }
        data["images"].append(image_info)
        uploaded.append(image_info)

    save_data(data)
    return {"uploaded": uploaded, "count": len(uploaded)}


@app.get("/api/images")
async def list_images(user: dict = Depends(get_current_user)):
    data = load_data()
    return {"images": list_user_images(data, user["id"])}


@app.delete("/api/images/{image_id}")
async def delete_image(image_id: str, user: dict = Depends(get_current_user)):
    data = load_data()
    image = next(
        (
            img
            for img in data["images"]
            if img["id"] == image_id and img.get("user_id") == user["id"]
        ),
        None,
    )
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    filepath = UPLOAD_DIR / image["stored_name"]
    if filepath.exists():
        filepath.unlink()

    data["images"] = [img for img in data["images"] if img["id"] != image_id]
    save_data(data)
    return {"message": "Deleted"}


@app.get("/api/uploads/{filename}")
async def get_upload(filename: str):
    filepath = UPLOAD_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404)
    return FileResponse(filepath)


@app.get("/api/videos/file/{filename}")
async def get_video_file(filename: str, request: Request):
    filepath = VIDEO_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404)

    file_size = filepath.stat().st_size
    range_header = request.headers.get("range")

    if range_header:
        range_spec = range_header.replace("bytes=", "")
        parts = range_spec.split("-")
        start = int(parts[0])
        end = int(parts[1]) if parts[1] else file_size - 1
        end = min(end, file_size - 1)
        length = end - start + 1

        def iter_file():
            with open(filepath, "rb") as f:
                f.seek(start)
                remaining = length
                while remaining > 0:
                    chunk = f.read(min(8192, remaining))
                    if not chunk:
                        break
                    remaining -= len(chunk)
                    yield chunk

        return StreamingResponse(
            iter_file(),
            status_code=206,
            media_type="video/mp4",
            headers={
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Accept-Ranges": "bytes",
                "Content-Length": str(length),
            },
        )

    return FileResponse(filepath, media_type="video/mp4", headers={"Accept-Ranges": "bytes"})


@app.post("/api/videos/generate")
async def generate_video(
    request: VideoGenerateRequest, user: dict = Depends(get_current_user)
):
    data = load_data()

    image_map = {img["id"]: img for img in list_user_images(data, user["id"])}
    for img_id in request.image_ids:
        if img_id not in image_map:
            raise HTTPException(status_code=404, detail=f"Image {img_id} not found")

    video_id = str(uuid.uuid4())
    video_filename = f"{video_id}.mp4"

    video_info = {
        "id": video_id,
        "user_id": user["id"],
        "filename": video_filename,
        "status": "processing",
        "image_ids": request.image_ids,
        "image_count": len(request.image_ids),
        "create_time": datetime.now().isoformat(),
        "settings": request.dict(),
        "progress": 0,
    }
    data["videos"].append(video_info)
    save_data(data)

    asyncio.create_task(
        _generate_video(video_id, request, image_map)
    )

    return {"video_id": video_id, "status": "processing"}


async def _generate_video(
    video_id: str, request: VideoGenerateRequest, image_map: dict
):
    try:
        from PIL import Image as PILImage
        import numpy as np
        import cv2

        video_path = VIDEO_DIR / f"{video_id}.mp4"

        vw = request.video_width if request.video_width % 2 == 0 else request.video_width + 1
        vh = request.video_height if request.video_height % 2 == 0 else request.video_height + 1

        fourcc = cv2.VideoWriter_fourcc(*"avc1")
        writer = cv2.VideoWriter(str(video_path), fourcc, request.fps, (vw, vh))

        if not writer.isOpened():
            raise RuntimeError("Failed to open VideoWriter")

        subtitle_map = {}
        if request.subtitles:
            for sub in request.subtitles:
                subtitle_map[sub.image_id] = sub.text

        total = len(request.image_ids)
        frames_per_image = int(request.duration_per_image * request.fps)
        fade_length = min(int(0.4 * request.fps), frames_per_image // 4)

        prev_frame = None

        for idx, img_id in enumerate(request.image_ids):
            img_info = image_map[img_id]
            img_path = UPLOAD_DIR / img_info["stored_name"]

            img = PILImage.open(str(img_path)).convert("RGB")
            img = _resize_cover(img, vw, vh)

            subtitle_text = subtitle_map.get(img_id, "")
            if subtitle_text:
                img = _draw_subtitle(
                    img,
                    subtitle_text,
                    request.font_size,
                    request.font_color,
                    request.subtitle_position,
                    request.subtitle_style,
                )

            frame = cv2.cvtColor(np.array(img, dtype=np.uint8), cv2.COLOR_RGB2BGR)

            if request.transition == "fade" and prev_frame is not None and fade_length > 0:
                for fi in range(fade_length):
                    alpha = (fi + 1) / (fade_length + 1)
                    blended = cv2.addWeighted(
                        prev_frame, 1 - alpha, frame, alpha, 0
                    )
                    writer.write(blended)
                normal_count = frames_per_image - fade_length
            else:
                normal_count = frames_per_image

            for _ in range(max(1, normal_count)):
                writer.write(frame)

            prev_frame = frame.copy()

            data = load_data()
            for v in data["videos"]:
                if v["id"] == video_id:
                    v["progress"] = int((idx + 1) / total * 100)
                    break
            save_data(data)
            await asyncio.sleep(0)

        writer.release()

        data = load_data()
        for v in data["videos"]:
            if v["id"] == video_id:
                v["status"] = "completed"
                v["progress"] = 100
                break
        save_data(data)

    except Exception as e:
        import traceback
        traceback.print_exc()
        data = load_data()
        for v in data["videos"]:
            if v["id"] == video_id:
                v["status"] = "failed"
                v["error"] = str(e)
                break
        save_data(data)


def _resize_cover(img, target_w: int, target_h: int):
    """Resize image to cover target dimensions while maintaining aspect ratio, then center-crop."""
    from PIL import Image as PILImage

    src_w, src_h = img.size
    scale = max(target_w / src_w, target_h / src_h)
    new_w = int(src_w * scale)
    new_h = int(src_h * scale)
    img = img.resize((new_w, new_h), PILImage.LANCZOS)

    left = (new_w - target_w) // 2
    top = (new_h - target_h) // 2
    return img.crop((left, top, left + target_w, top + target_h))


def _load_font(font_size: int):
    from PIL import ImageFont

    font_paths = [
        "C:/Windows/Fonts/msyh.ttc",
        "C:/Windows/Fonts/simhei.ttf",
        "C:/Windows/Fonts/arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/System/Library/Fonts/PingFang.ttc",
    ]
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                return ImageFont.truetype(fp, font_size)
            except Exception:
                continue
    return ImageFont.load_default()


def _hex_to_rgb(hex_color: str) -> tuple:
    return tuple(int(hex_color.lstrip("#")[i : i + 2], 16) for i in (0, 2, 4))


def _calc_text_position(draw, text, font, img_size, position):
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    w, h = img_size
    x = (w - tw) // 2

    if position == "top":
        y = 40
    elif position == "center":
        y = (h - th) // 2
    else:
        y = h - th - 50

    return x, y, tw, th


def _draw_subtitle(
    img,
    text: str,
    font_size: int,
    font_color: str,
    position: str,
    style: str = "stroke",
):
    from PIL import Image as PILImage, ImageDraw, ImageFont, ImageFilter

    font = _load_font(font_size)
    color = _hex_to_rgb(font_color)

    if style == "stroke":
        return _draw_stroke_subtitle(img, text, font, color, position, font_size)
    elif style == "shadow":
        return _draw_shadow_subtitle(img, text, font, color, position, font_size)
    elif style == "gradient":
        return _draw_gradient_subtitle(img, text, font, color, position, font_size)
    elif style == "glass":
        return _draw_glass_subtitle(img, text, font, color, position, font_size)
    else:
        return _draw_classic_subtitle(img, text, font, color, position, font_size)


def _draw_stroke_subtitle(img, text, font, color, position, font_size):
    """White text with thick black outline — works on any background, like Netflix/YouTube."""
    from PIL import Image as PILImage, ImageDraw

    w, h = img.size
    txt_layer = PILImage.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(txt_layer)
    x, y, tw, th = _calc_text_position(draw, text, font, (w, h), position)

    stroke_width = max(2, font_size // 14)
    draw.text(
        (x, y), text, font=font, fill=(*color, 255),
        stroke_width=stroke_width, stroke_fill=(0, 0, 0, 220),
    )

    return PILImage.alpha_composite(img.convert("RGBA"), txt_layer).convert("RGB")


def _draw_shadow_subtitle(img, text, font, color, position, font_size):
    """Clean text with soft drop shadow — modern and elegant."""
    from PIL import Image as PILImage, ImageDraw, ImageFilter

    w, h = img.size
    offset = max(2, font_size // 16)

    shadow_layer = PILImage.new("RGBA", (w, h), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow_layer)
    x, y, tw, th = _calc_text_position(sd, text, font, (w, h), position)
    sd.text((x + offset, y + offset), text, font=font, fill=(0, 0, 0, 180))
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(radius=font_size // 8))

    txt_layer = PILImage.new("RGBA", (w, h), (0, 0, 0, 0))
    td = ImageDraw.Draw(txt_layer)
    td.text((x, y), text, font=font, fill=(*color, 255))

    result = PILImage.alpha_composite(img.convert("RGBA"), shadow_layer)
    result = PILImage.alpha_composite(result, txt_layer)
    return result.convert("RGB")


def _draw_gradient_subtitle(img, text, font, color, position, font_size):
    """Text over a cinematic gradient fade — like movie subtitles."""
    from PIL import Image as PILImage, ImageDraw
    import numpy as np

    w, h = img.size
    grad_h = max(font_size * 4, h // 5)

    grad_array = np.zeros((grad_h, w, 4), dtype=np.uint8)
    for row in range(grad_h):
        alpha = int(160 * (row / grad_h))
        grad_array[row, :] = [0, 0, 0, alpha]

    grad_layer = PILImage.new("RGBA", (w, h), (0, 0, 0, 0))
    grad_strip = PILImage.fromarray(grad_array, "RGBA")

    if position == "top":
        grad_strip = grad_strip.transpose(PILImage.FLIP_TOP_BOTTOM)
        grad_layer.paste(grad_strip, (0, 0))
    elif position == "center":
        pass
    else:
        grad_layer.paste(grad_strip, (0, h - grad_h))

    txt_layer = PILImage.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(txt_layer)
    x, y, tw, th = _calc_text_position(draw, text, font, (w, h), position)
    stroke_w = max(1, font_size // 20)
    draw.text(
        (x, y), text, font=font, fill=(*color, 255),
        stroke_width=stroke_w, stroke_fill=(0, 0, 0, 120),
    )

    result = PILImage.alpha_composite(img.convert("RGBA"), grad_layer)
    result = PILImage.alpha_composite(result, txt_layer)
    return result.convert("RGB")


def _draw_glass_subtitle(img, text, font, color, position, font_size):
    """Frosted glass panel behind text — modern UI style."""
    from PIL import Image as PILImage, ImageDraw, ImageFilter

    w, h = img.size

    tmp_draw = ImageDraw.Draw(img)
    x, y, tw, th = _calc_text_position(tmp_draw, text, font, (w, h), position)

    pad_x, pad_y = 24, 14
    radius = 16
    box = (x - pad_x, y - pad_y, x + tw + pad_x, y + th + pad_y)

    rgba = img.convert("RGBA")
    region = rgba.crop(box)
    blurred = region.filter(ImageFilter.GaussianBlur(radius=18))
    tint = PILImage.new("RGBA", region.size, (0, 0, 0, 100))
    blurred = PILImage.alpha_composite(blurred, tint)

    mask = PILImage.new("L", region.size, 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle(
        [(0, 0), (region.size[0], region.size[1])],
        radius=radius, fill=255,
    )

    rgba.paste(blurred, box, mask)

    txt_layer = PILImage.new("RGBA", (w, h), (0, 0, 0, 0))
    td = ImageDraw.Draw(txt_layer)
    td.text((x, y), text, font=font, fill=(*color, 255))

    result = PILImage.alpha_composite(rgba, txt_layer)
    return result.convert("RGB")


def _draw_classic_subtitle(img, text, font, color, position, font_size):
    """Classic semi-transparent box — fixed to properly support transparency."""
    from PIL import Image as PILImage, ImageDraw

    w, h = img.size
    rgba = img.convert("RGBA")
    overlay = PILImage.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    x, y, tw, th = _calc_text_position(draw, text, font, (w, h), position)

    pad = 14
    radius = 10
    draw.rounded_rectangle(
        [x - pad, y - pad, x + tw + pad, y + th + pad],
        radius=radius, fill=(0, 0, 0, 140),
    )
    draw.text((x, y), text, font=font, fill=(*color, 255))

    result = PILImage.alpha_composite(rgba, overlay)
    return result.convert("RGB")


@app.get("/api/videos")
async def list_videos(user: dict = Depends(get_current_user)):
    data = load_data()
    return {"videos": list_user_videos(data, user["id"])}


@app.delete("/api/videos/{video_id}")
async def delete_video(video_id: str, user: dict = Depends(get_current_user)):
    data = load_data()
    video = next(
        (
            v
            for v in data["videos"]
            if v["id"] == video_id and v.get("user_id") == user["id"]
        ),
        None,
    )
    if not video:
        raise HTTPException(status_code=404)

    filepath = VIDEO_DIR / video["filename"]
    if filepath.exists():
        filepath.unlink()

    data["videos"] = [v for v in data["videos"] if v["id"] != video_id]
    save_data(data)
    return {"message": "Deleted"}


@app.get("/api/finance/overview")
async def finance_overview(user: dict = Depends(get_current_user)):
    data = load_data()
    transactions = sorted(
        list_user_transactions(data, user["id"]),
        key=lambda item: item.get("occurred_at", ""),
        reverse=True,
    )

    income = sum(item["amount"] for item in transactions if item["type"] == "income")
    expense = sum(item["amount"] for item in transactions if item["type"] == "expense")
    balance = income - expense

    monthly_expense = {}
    category_expense = {}
    for item in transactions:
        if item["type"] != "expense":
            continue
        month_key = item["occurred_at"][:7]
        monthly_expense[month_key] = monthly_expense.get(month_key, 0) + item["amount"]
        category = item["category"]
        category_expense[category] = category_expense.get(category, 0) + item["amount"]

    top_categories = sorted(
        (
            {"category": key, "amount": value}
            for key, value in category_expense.items()
        ),
        key=lambda item: item["amount"],
        reverse=True,
    )[:5]

    recent_transactions = transactions[:12]

    return {
        "summary": {
            "income": round(income, 2),
            "expense": round(expense, 2),
            "balance": round(balance, 2),
            "transaction_count": len(transactions),
        },
        "monthly_expense": [
            {"month": key, "amount": round(value, 2)}
            for key, value in sorted(monthly_expense.items())
        ],
        "top_categories": top_categories,
        "transactions": recent_transactions,
    }


@app.get("/api/finance/transactions")
async def list_transactions(user: dict = Depends(get_current_user)):
    data = load_data()
    transactions = sorted(
        list_user_transactions(data, user["id"]),
        key=lambda item: (item.get("occurred_at", ""), item.get("created_at", "")),
        reverse=True,
    )
    return {"transactions": transactions}


@app.post("/api/finance/transactions")
async def create_transaction(
    payload: TransactionCreateRequest, user: dict = Depends(get_current_user)
):
    tx_type = payload.type.strip().lower()
    if tx_type not in {"income", "expense"}:
        raise HTTPException(status_code=400, detail="Invalid transaction type")

    data = load_data()
    transaction = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "title": payload.title.strip(),
        "amount": round(payload.amount, 2),
        "type": tx_type,
        "category": payload.category.strip() or "未分类",
        "note": payload.note.strip(),
        "occurred_at": payload.occurred_at,
        "created_at": datetime.now().isoformat(),
    }
    data["transactions"].append(transaction)
    save_data(data)
    return {"transaction": transaction}


@app.delete("/api/finance/transactions/{transaction_id}")
async def delete_transaction(
    transaction_id: str, user: dict = Depends(get_current_user)
):
    data = load_data()
    exists = any(
        item["id"] == transaction_id and item.get("user_id") == user["id"]
        for item in data["transactions"]
    )
    if not exists:
        raise HTTPException(status_code=404, detail="Transaction not found")

    data["transactions"] = [
        item
        for item in data["transactions"]
        if not (item["id"] == transaction_id and item.get("user_id") == user["id"])
    ]
    save_data(data)
    return {"message": "Deleted"}


@app.get("/api/stocks/dashboard")
async def stock_dashboard(user: dict = Depends(get_current_user)):
    data = load_data()
    preferences = ensure_stock_profile(data, user["id"])
    latest_scan = ensure_latest_stock_scan(data, user["id"])
    return {
        "concept_sections": CONCEPT_SECTIONS,
        "preferences": preferences,
        "latest_scan": latest_scan,
    }


@app.post("/api/stocks/preferences")
async def update_stock_preferences(
    payload: StockPreferenceUpdateRequest, user: dict = Depends(get_current_user)
):
    if payload.min_price >= payload.max_price:
        raise HTTPException(status_code=400, detail="Minimum price must be below maximum price")

    data = load_data()
    preferences = merge_preferences(payload.dict())
    data["stock_preferences"][user["id"]] = preferences
    latest_scan = run_stock_scan(preferences)
    data["stock_scans"][user["id"]] = latest_scan
    save_data(data)
    return {
        "preferences": preferences,
        "latest_scan": latest_scan,
    }


@app.post("/api/stocks/scan")
async def run_manual_stock_scan(user: dict = Depends(get_current_user)):
    data = load_data()
    preferences = ensure_stock_profile(data, user["id"])
    latest_scan = run_stock_scan(preferences)
    data["stock_scans"][user["id"]] = latest_scan
    save_data(data)
    return {"latest_scan": latest_scan}


@app.on_event("startup")
async def schedule_daily_stock_scan():
    asyncio.create_task(_stock_scan_daemon())


async def _stock_scan_daemon():
    while True:
        try:
            data = load_data()
            users = load_users().get("users", [])
            changed = False
            for user in users:
                user_id = user.get("id")
                if not user_id:
                    continue
                preferences = ensure_stock_profile(data, user_id)
                latest_scan = data["stock_scans"].get(user_id)
                today = datetime.now().date().isoformat()
                if preferences.get("refresh_daily", True) and (
                    not latest_scan or latest_scan.get("generated_date") != today
                ):
                    data["stock_scans"][user_id] = run_stock_scan(preferences)
                    changed = True
            if changed:
                save_data(data)
        except Exception:
            pass

        await asyncio.sleep(60 * 30)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
