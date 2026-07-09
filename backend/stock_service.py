from __future__ import annotations

import json
from datetime import datetime
from typing import Dict, List, Tuple
from urllib.parse import urlencode
from urllib.request import Request, urlopen


DEFAULT_STOCK_PREFERENCES = {
    "min_price": 3.0,
    "max_price": 60.0,
    "recommendation_count": 10,
    "max_pe_ttm": 30.0,
    "max_pb": 3.5,
    "min_turnover_rate": 0.8,
    "min_amount_million": 80.0,
    "refresh_daily": True,
}


CONCEPT_SECTIONS = [
    {
        "title": "估值",
        "description": "先看市场愿意按几倍家底、几倍利润来给公司定价。",
        "items": [
            {
                "term": "总市值",
                "plain": "市场现在给整家公司标的总价格。",
                "formula": "股价 x 总股本",
                "hint": "它是市场报价，不等于公司绝对真实价值。",
            },
            {
                "term": "市净率 PB",
                "plain": "市场愿意按公司家底的几倍来买。",
                "formula": "股价 / 每股净资产",
                "hint": "PB 低不一定便宜，可能是资产质量差；PB 高不一定差，可能是成长预期强。",
            },
            {
                "term": "市盈率 PE(静)",
                "plain": "用上一整个年度净利润算出来的估值倍数。",
                "formula": "总市值 / 上一年度净利润",
                "hint": "适合看历史口径，但可能有些滞后。",
            },
            {
                "term": "市盈率 PE(TTM)",
                "plain": "用最近 12 个月净利润算出来的估值倍数。",
                "formula": "总市值 / 最近12个月净利润",
                "hint": "通常比静态 PE 更贴近当前经营状态。",
            },
            {
                "term": "市盈率 PE(动)",
                "plain": "用未来预测利润算出来的估值倍数。",
                "formula": "总市值 / 预测未来净利润",
                "hint": "反映市场预期，但误差也最大。",
            },
        ],
    },
    {
        "title": "盈利能力",
        "description": "看公司到底赚不赚钱，以及赚钱效率高不高。",
        "items": [
            {
                "term": "每股收益 EPS",
                "plain": "平均每一股能赚多少钱。",
                "formula": "净利润 / 总股本",
                "hint": "EPS 越高通常越好，但要看利润是否可持续。",
            },
            {
                "term": "每股收益 EPS(TTM)",
                "plain": "最近 12 个月每一股赚了多少钱。",
                "formula": "最近12个月净利润 / 总股本",
                "hint": "看当下盈利能力更常用。",
            },
            {
                "term": "净资产收益率 ROE",
                "plain": "拿股东家底去赚钱的效率。",
                "formula": "净利润 / 净资产",
                "hint": "ROE 越高，通常说明公司用资本赚钱更有效率。",
            },
            {
                "term": "每股净资产",
                "plain": "平均每一股背后账面上有多少家底。",
                "formula": "净资产 / 总股本",
                "hint": "它和 PB 一起看最直观。",
            },
        ],
    },
    {
        "title": "交易热度",
        "description": "看今天这只股票热不热，谁更主动，筹码换手强不强。",
        "items": [
            {
                "term": "换手率",
                "plain": "今天流通股里有多少比例完成了交易。",
                "formula": "成交股数 / 流通股数",
                "hint": "高换手代表活跃和分歧，低换手代表冷清。",
            },
            {
                "term": "量比",
                "plain": "今天当前成交量和过去几天平均成交量的对比。",
                "formula": "当前成交量 / 近期平均同期成交量",
                "hint": "量比大于 1 通常代表今天放量。",
            },
            {
                "term": "内盘",
                "plain": "主动按买价卖出的成交量，通常代表卖盘更主动。",
                "formula": "主动卖出成交量",
                "hint": "只能辅助判断，不能单独拿来做买卖依据。",
            },
            {
                "term": "外盘",
                "plain": "主动按卖价买入的成交量，通常代表买盘更主动。",
                "formula": "主动买入成交量",
                "hint": "和内盘结合看更有意义。",
            },
        ],
    },
    {
        "title": "股东回报",
        "description": "看公司是否愿意把利润分给股东。",
        "items": [
            {
                "term": "股息(TTM)",
                "plain": "最近 12 个月每股分了多少钱。",
                "formula": "最近12个月每股现金分红",
                "hint": "适合看现金回报习惯。",
            },
            {
                "term": "股息率(TTM)",
                "plain": "按当前价格买入，分红回报率有多少。",
                "formula": "最近12个月每股分红 / 当前股价",
                "hint": "高股息不等于一定安全，还要看利润是否稳。",
            },
        ],
    },
]


FALLBACK_STOCKS = [
    {"code": "600036", "name": "招商银行", "price": 34.2, "change_pct": 1.2, "turnover_rate": 1.1, "amount_million": 1650, "pe_ttm": 6.5, "pb": 0.96, "market_cap_billion": 862, "source": "fallback"},
    {"code": "601398", "name": "工商银行", "price": 6.1, "change_pct": 0.7, "turnover_rate": 0.4, "amount_million": 980, "pe_ttm": 6.2, "pb": 0.68, "market_cap_billion": 2170, "source": "fallback"},
    {"code": "600938", "name": "中国海油", "price": 29.8, "change_pct": 1.6, "turnover_rate": 0.9, "amount_million": 1250, "pe_ttm": 8.7, "pb": 1.62, "market_cap_billion": 1410, "source": "fallback"},
    {"code": "600900", "name": "长江电力", "price": 28.5, "change_pct": 0.8, "turnover_rate": 0.6, "amount_million": 760, "pe_ttm": 21.4, "pb": 3.08, "market_cap_billion": 697, "source": "fallback"},
    {"code": "601088", "name": "中国神华", "price": 42.6, "change_pct": 0.5, "turnover_rate": 0.7, "amount_million": 880, "pe_ttm": 12.1, "pb": 1.78, "market_cap_billion": 845, "source": "fallback"},
    {"code": "600426", "name": "华鲁恒升", "price": 24.9, "change_pct": 1.9, "turnover_rate": 1.2, "amount_million": 420, "pe_ttm": 13.6, "pb": 2.05, "market_cap_billion": 528, "source": "fallback"},
    {"code": "600019", "name": "宝钢股份", "price": 6.8, "change_pct": 0.9, "turnover_rate": 0.8, "amount_million": 360, "pe_ttm": 9.8, "pb": 0.74, "market_cap_billion": 149, "source": "fallback"},
    {"code": "000651", "name": "格力电器", "price": 41.5, "change_pct": 0.6, "turnover_rate": 1.0, "amount_million": 940, "pe_ttm": 8.9, "pb": 1.82, "market_cap_billion": 233, "source": "fallback"},
    {"code": "600809", "name": "山西汾酒", "price": 216.0, "change_pct": 1.3, "turnover_rate": 0.9, "amount_million": 1420, "pe_ttm": 24.8, "pb": 8.1, "market_cap_billion": 2635, "source": "fallback"},
    {"code": "002142", "name": "宁波银行", "price": 22.8, "change_pct": 1.1, "turnover_rate": 0.9, "amount_million": 520, "pe_ttm": 5.6, "pb": 0.82, "market_cap_billion": 150, "source": "fallback"},
    {"code": "600309", "name": "万华化学", "price": 79.3, "change_pct": 0.9, "turnover_rate": 0.8, "amount_million": 1180, "pe_ttm": 16.4, "pb": 2.65, "market_cap_billion": 2490, "source": "fallback"},
    {"code": "000333", "name": "美的集团", "price": 66.9, "change_pct": 0.4, "turnover_rate": 0.7, "amount_million": 1520, "pe_ttm": 12.9, "pb": 2.71, "market_cap_billion": 4680, "source": "fallback"},
]


def merge_preferences(current: Dict) -> Dict:
    merged = dict(DEFAULT_STOCK_PREFERENCES)
    if current:
        merged.update({key: value for key, value in current.items() if value is not None})
    return merged


def fetch_a_share_snapshot() -> Tuple[List[Dict], str]:
    params = {
        "pn": 1,
        "pz": 5000,
        "po": 1,
        "np": 1,
        "fltt": 2,
        "invt": 2,
        "fid": "f3",
        "fs": "m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23",
        "fields": "f12,f14,f2,f3,f6,f8,f9,f20,f21,f23,f115",
    }
    url = "https://push2.eastmoney.com/api/qt/clist/get?" + urlencode(params)
    request = Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json,text/plain,*/*",
            "Referer": "https://quote.eastmoney.com/",
        },
    )

    try:
        with urlopen(request, timeout=12) as response:
            payload = json.loads(response.read().decode("utf-8"))
        diff = ((payload or {}).get("data") or {}).get("diff") or []
        stocks = []
        for item in diff:
            price = _to_float(item.get("f2"))
            pe_ttm = _to_float(item.get("f115"))
            pb = _to_float(item.get("f23"))
            amount = _to_float(item.get("f6"))
            turnover_rate = _to_float(item.get("f8"))
            if price <= 0:
                continue
            stocks.append(
                {
                    "code": str(item.get("f12", "")),
                    "name": str(item.get("f14", "")),
                    "price": price,
                    "change_pct": _to_float(item.get("f3")),
                    "turnover_rate": turnover_rate,
                    "amount_million": round(amount / 1_000_000, 2),
                    "pe_ttm": pe_ttm,
                    "pb": pb,
                    "market_cap_billion": round(_to_float(item.get("f20")) / 100_000_000, 2),
                    "circulating_market_cap_billion": round(
                        _to_float(item.get("f21")) / 100_000_000, 2
                    ),
                    "source": "eastmoney",
                }
            )
        return stocks, "eastmoney"
    except Exception:
        return FALLBACK_STOCKS, "fallback"


def run_stock_scan(preferences: Dict) -> Dict:
    prefs = merge_preferences(preferences)
    stocks, source = fetch_a_share_snapshot()

    strict_candidates = _filter_candidates(stocks, prefs, relaxed=False)
    selection_mode = "strict"
    if len(strict_candidates) < int(prefs["recommendation_count"]):
        strict_candidates = _filter_candidates(stocks, prefs, relaxed=True)
        selection_mode = "relaxed"

    ranked = sorted(strict_candidates, key=lambda item: item["score"], reverse=True)[
        : int(prefs["recommendation_count"])
    ]
    generated_at = datetime.now().isoformat()

    return {
        "generated_at": generated_at,
        "generated_date": generated_at[:10],
        "source": source,
        "selection_mode": selection_mode,
        "preferences": prefs,
        "summary": _build_summary(ranked, prefs, source, selection_mode, len(stocks)),
        "recommendations": ranked,
    }


def _filter_candidates(stocks: List[Dict], prefs: Dict, relaxed: bool) -> List[Dict]:
    items = []
    for stock in stocks:
        name = stock.get("name", "")
        price = stock.get("price", 0)
        pe_ttm = stock.get("pe_ttm", 0)
        pb = stock.get("pb", 0)
        turnover_rate = stock.get("turnover_rate", 0)
        amount_million = stock.get("amount_million", 0)
        change_pct = stock.get("change_pct", 0)

        if not name or "ST" in name.upper():
            continue
        if price < prefs["min_price"] or price > prefs["max_price"]:
            continue
        if pe_ttm <= 0 or pb <= 0:
            continue

        pe_limit = prefs["max_pe_ttm"] * (1.35 if relaxed else 1)
        pb_limit = prefs["max_pb"] * (1.25 if relaxed else 1)
        turnover_floor = prefs["min_turnover_rate"] * (0.6 if relaxed else 1)
        amount_floor = prefs["min_amount_million"] * (0.5 if relaxed else 1)

        if pe_ttm > pe_limit or pb > pb_limit:
            continue
        if turnover_rate < turnover_floor or amount_million < amount_floor:
            continue
        if change_pct < -6 or change_pct > 6.5:
            continue

        reason_lines = [
            f"股价 {price:.2f} 元，处于你设定的价格区间内",
            f"市盈率TTM {pe_ttm:.2f} 倍，估值未明显过热",
            f"市净率 {pb:.2f} 倍，资产定价相对克制",
            f"换手率 {turnover_rate:.2f}% 、成交额 {amount_million:.0f} 百万，流动性尚可",
        ]

        if 0 <= change_pct <= 4:
            reason_lines.append(f"日内涨跌幅 {change_pct:.2f}% ，属于较温和的强势区间")
        elif change_pct < 0:
            reason_lines.append(f"日内回落 {abs(change_pct):.2f}% ，可视作回踩观察标的")

        stock_item = {
            **stock,
            "score": _score_stock(stock, prefs),
            "reasons": reason_lines,
            "commentary": _build_commentary(stock),
            "risks": _build_risks(stock, prefs),
        }
        items.append(stock_item)
    return items


def _score_stock(stock: Dict, prefs: Dict) -> float:
    pe_ttm = stock.get("pe_ttm", 0)
    pb = stock.get("pb", 0)
    turnover_rate = stock.get("turnover_rate", 0)
    amount_million = stock.get("amount_million", 0)
    change_pct = stock.get("change_pct", 0)
    price = stock.get("price", 0)

    value_score = max(0, 40 - pe_ttm) * 1.2 + max(0, 4 - pb) * 10
    liquidity_score = min(turnover_rate, 8) * 5 + min(amount_million / 80, 15) * 2.4
    momentum_score = 12 - abs(change_pct - 1.5) * 2
    affordability_score = max(0, prefs["max_price"] - price) * 0.25
    return round(value_score + liquidity_score + momentum_score + affordability_score, 2)


def _build_commentary(stock: Dict) -> str:
    return (
        f"{stock['name']} 当前更像一只“估值不过热 + 流动性达标”的日度初筛标的，"
        f"适合放进观察池继续看基本面、行业景气和后续财报。"
    )


def _build_risks(stock: Dict, prefs: Dict) -> List[str]:
    risks = []
    if stock.get("pe_ttm", 0) > prefs["max_pe_ttm"] * 0.8:
        risks.append("估值已经接近你设定的上限，安全边际一般。")
    if stock.get("pb", 0) > prefs["max_pb"] * 0.8:
        risks.append("PB 处于筛选上沿，更适合结合盈利质量一起复核。")
    if stock.get("turnover_rate", 0) > 6:
        risks.append("换手率偏高，短线资金博弈成分在增强。")
    if stock.get("change_pct", 0) > 4:
        risks.append("日内涨幅偏大，追高胜率会下降。")
    if not risks:
        risks.append("仍需结合财报、行业景气与公司公告做二次判断。")
    return risks


def _build_summary(
    ranked: List[Dict], prefs: Dict, source: str, selection_mode: str, universe_size: int
) -> str:
    if not ranked:
        return "当前筛选条件下没有找到合适标的，建议适度放宽价格上限、PB 或换手率条件。"

    return (
        f"本次从约 {universe_size} 只股票中完成日度扫描，数据源为 {source}，"
        f"按 {'严格' if selection_mode == 'strict' else '宽松'} 条件筛出 {len(ranked)} 只候选。"
        f"当前更偏向低估值、流动性达标、单价不超过 {prefs['max_price']:.0f} 元的标的。"
    )


def _to_float(value) -> float:
    try:
        if value in (None, "-", ""):
            return 0.0
        return float(value)
    except (TypeError, ValueError):
        return 0.0
