import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarRange,
  Filter,
  Plus,
  Search,
  Trash2,
  WalletCards,
} from "lucide-react";
import api from "../api/client";

const defaultForm = {
  title: "",
  amount: "",
  type: "expense",
  category: "运营支出",
  note: "",
  occurred_at: new Date().toISOString().slice(0, 10),
};

const categories = {
  expense: ["运营支出", "软件订阅", "云服务", "素材采购", "团队开销", "市场推广"],
  income: ["客户回款", "咨询服务", "系统订阅", "其他收入"],
};

export default function FinancePage() {
  const [overview, setOverview] = useState({
    summary: {
      income: 0,
      expense: 0,
      balance: 0,
      transaction_count: 0,
    },
    monthly_expense: [],
    top_categories: [],
    transactions: [],
  });
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    type: "all",
    month: "all",
    keyword: "",
  });

  const fetchOverview = async () => {
    const { data } = await api.get("/finance/overview");
    setOverview(data);
  };

  const fetchTransactions = async () => {
    const { data } = await api.get("/finance/transactions");
    setTransactions(data.transactions);
  };

  useEffect(() => {
    fetchOverview();
    fetchTransactions();
  }, []);

  const monthlyPeak = useMemo(() => {
    const values = overview.monthly_expense.map((item) => item.amount);
    return Math.max(...values, 1);
  }, [overview.monthly_expense]);

  const monthOptions = useMemo(() => {
    return Array.from(new Set(transactions.map((item) => item.occurred_at.slice(0, 7))));
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((item) => {
      const matchesType = filters.type === "all" || item.type === filters.type;
      const matchesMonth =
        filters.month === "all" || item.occurred_at.startsWith(filters.month);
      const keyword = filters.keyword.trim().toLowerCase();
      const matchesKeyword =
        !keyword ||
        item.title.toLowerCase().includes(keyword) ||
        item.category.toLowerCase().includes(keyword) ||
        item.note.toLowerCase().includes(keyword);

      return matchesType && matchesMonth && matchesKeyword;
    });
  }, [transactions, filters]);

  const latestMonth = monthOptions[0] || new Date().toISOString().slice(0, 7);

  const thisMonthStats = useMemo(() => {
    const items = transactions.filter((item) => item.occurred_at.startsWith(latestMonth));
    const income = items
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + Number(item.amount), 0);
    const expense = items
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + Number(item.amount), 0);
    return {
      income,
      expense,
      net: income - expense,
      count: items.length,
    };
  }, [transactions, latestMonth]);

  const averageExpense = useMemo(() => {
    const expenses = transactions.filter((item) => item.type === "expense");
    if (expenses.length === 0) return 0;
    return (
      expenses.reduce((sum, item) => sum + Number(item.amount), 0) / expenses.length
    );
  }, [transactions]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/finance/transactions", {
        ...form,
        amount: Number(form.amount),
      });
      setForm({
        ...defaultForm,
        type: form.type,
        category: categories[form.type][0],
      });
      await fetchOverview();
      await fetchTransactions();
    } finally {
      setSubmitting(false);
    }
  };

  const handleTypeChange = (type) => {
    setForm((prev) => ({
      ...prev,
      type,
      category: categories[type][0],
    }));
  };

  const deleteTransaction = async (id) => {
    await api.delete(`/finance/transactions/${id}`);
    await fetchOverview();
    await fetchTransactions();
  };

  return (
    <div className="finance-page">
      <section className="finance-hero finance-desktop-hero">
        <div>
          <p className="section-kicker">Bookkeeping Workspace</p>
          <h2>桌面财务工作台</h2>
          <p className="hero-desc">
            按桌面后台的方式管理流水、筛选明细、查看月度走势和分类支出。
          </p>
        </div>
        <div className="finance-hero-badge">
          <WalletCards size={18} />
          Ledger Workspace
        </div>
      </section>

      <section className="finance-toolbar-card">
        <div className="finance-toolbar-left">
          <div className="finance-toolbar-title">
            <Filter size={16} />
            <span>筛选器</span>
          </div>
          <div className="finance-filter-switch">
            {[
              ["all", "全部"],
              ["expense", "支出"],
              ["income", "收入"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={filters.type === value ? "active" : ""}
                onClick={() => setFilters((prev) => ({ ...prev, type: value }))}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="finance-toolbar-right">
          <label className="finance-inline-field finance-inline-search">
            <Search size={16} />
            <input
              value={filters.keyword}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, keyword: event.target.value }))
              }
              placeholder="搜索标题、分类、备注"
            />
          </label>
          <label className="finance-inline-field">
            <CalendarRange size={16} />
            <select
              value={filters.month}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, month: event.target.value }))
              }
            >
              <option value="all">全部月份</option>
              {monthOptions.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="finance-summary-grid finance-summary-grid-wide">
        <MetricCard label="当前结余" value={overview.summary.balance} emphasis="primary" />
        <MetricCard label="累计收入" value={overview.summary.income} emphasis="success" />
        <MetricCard label="累计支出" value={overview.summary.expense} emphasis="danger" />
        <MetricCard label="本月收入" value={thisMonthStats.income} emphasis="success" />
        <MetricCard label="本月支出" value={thisMonthStats.expense} emphasis="danger" />
        <MetricCard
          label="平均支出"
          value={averageExpense}
          emphasis="primary"
        />
        <MetricCard label="本月净流入" value={thisMonthStats.net} emphasis="primary" />
        <MetricCard label="筛选结果" value={filteredTransactions.length} emphasis="neutral" plain />
      </section>

      <section className="finance-desktop-layout">
        <div className="finance-desktop-main">
          <section className="finance-analytics-grid">
            <div className="finance-card">
              <div className="finance-card-head">
                <div>
                  <p className="section-kicker">Expense Trend</p>
                  <h3>月度支出趋势</h3>
                </div>
              </div>

              <div className="finance-bars">
                {overview.monthly_expense.length === 0 ? (
                  <div className="empty-panel">还没有账目，先在右侧新增一笔流水。</div>
                ) : (
                  overview.monthly_expense.map((item) => (
                    <div key={item.month} className="finance-bar-row">
                      <span>{item.month}</span>
                      <div className="finance-bar-track">
                        <div
                          className="finance-bar-fill"
                          style={{ width: `${(item.amount / monthlyPeak) * 100}%` }}
                        />
                      </div>
                      <strong>¥{item.amount.toFixed(0)}</strong>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="finance-card">
              <div className="finance-card-head">
                <div>
                  <p className="section-kicker">Category Breakdown</p>
                  <h3>支出分类分布</h3>
                </div>
              </div>

              <div className="finance-category-list finance-category-rich-list">
                {overview.top_categories.length === 0 ? (
                  <div className="empty-panel">暂无分类数据。</div>
                ) : (
                  overview.top_categories.map((item) => {
                    const ratio =
                      overview.summary.expense > 0
                        ? (Number(item.amount) / Number(overview.summary.expense)) * 100
                        : 0;
                    return (
                      <div key={item.category} className="finance-category-rich-item">
                        <div className="finance-category-rich-head">
                          <span>{item.category}</span>
                          <strong>¥{Number(item.amount).toFixed(2)}</strong>
                        </div>
                        <div className="finance-bar-track">
                          <div
                            className="finance-bar-fill"
                            style={{ width: `${ratio}%` }}
                          />
                        </div>
                        <p>{ratio.toFixed(1)}% 的累计支出</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>

          <div className="finance-card">
            <div className="finance-card-head">
              <div>
                <p className="section-kicker">Ledger Table</p>
                <h3>流水明细表</h3>
              </div>
              <div className="finance-ledger-meta">
                共 {filteredTransactions.length} 条
              </div>
            </div>

            <div className="finance-table-wrap">
              {filteredTransactions.length === 0 ? (
                <div className="empty-panel">当前筛选条件下没有匹配流水。</div>
              ) : (
                <table className="finance-table">
                  <thead>
                    <tr>
                      <th>日期</th>
                      <th>标题</th>
                      <th>分类</th>
                      <th>类型</th>
                      <th>备注</th>
                      <th>金额</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((item) => (
                      <tr key={item.id}>
                        <td>{item.occurred_at}</td>
                        <td>
                          <div className="finance-table-title-cell">
                            <span className={`finance-transaction-icon ${item.type}`}>
                              {item.type === "income" ? (
                                <ArrowDownLeft size={14} />
                              ) : (
                                <ArrowUpRight size={14} />
                              )}
                            </span>
                            <strong>{item.title}</strong>
                          </div>
                        </td>
                        <td>{item.category}</td>
                        <td>
                          <span className={`finance-table-type ${item.type}`}>
                            {item.type === "income" ? "收入" : "支出"}
                          </span>
                        </td>
                        <td className="finance-table-note">{item.note || "-"}</td>
                        <td className={item.type === "income" ? "income-text" : "expense-text"}>
                          {item.type === "income" ? "+" : "-"}¥{Number(item.amount).toFixed(2)}
                        </td>
                        <td>
                          <button
                            className="finance-delete-btn"
                            onClick={() => deleteTransaction(item.id)}
                            title="删除"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <aside className="finance-desktop-side">
          <form className="finance-card finance-form-card" onSubmit={handleSubmit}>
            <div className="finance-card-head">
              <div>
                <p className="section-kicker">New Record</p>
                <h3>新增流水</h3>
              </div>
              <div className="finance-form-icon">
                <Plus size={16} />
              </div>
            </div>

            <div className="finance-type-switch">
              <button
                type="button"
                className={form.type === "expense" ? "active" : ""}
                onClick={() => handleTypeChange("expense")}
              >
                支出
              </button>
              <button
                type="button"
                className={form.type === "income" ? "active" : ""}
                onClick={() => handleTypeChange("income")}
              >
                收入
              </button>
            </div>

            <label className="finance-field">
              <span>标题</span>
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, title: event.target.value }))
                }
                placeholder="例如：云渲染服务"
                required
              />
            </label>

            <label className="finance-field">
              <span>金额</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, amount: event.target.value }))
                }
                placeholder="0.00"
                required
              />
            </label>

            <label className="finance-field">
              <span>分类</span>
              <select
                value={form.category}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, category: event.target.value }))
                }
              >
                {categories[form.type].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="finance-field">
              <span>日期</span>
              <input
                type="date"
                value={form.occurred_at}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, occurred_at: event.target.value }))
                }
                required
              />
            </label>

            <label className="finance-field">
              <span>备注</span>
              <textarea
                rows="4"
                value={form.note}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, note: event.target.value }))
                }
                placeholder="补充说明这笔账目"
              />
            </label>

            <button className="auth-submit-btn" type="submit" disabled={submitting}>
              {submitting ? "保存中..." : "保存流水"}
            </button>
          </form>

          <div className="finance-card">
            <div className="finance-card-head">
              <div>
                <p className="section-kicker">Month Snapshot</p>
                <h3>{latestMonth} 月快照</h3>
              </div>
            </div>

            <div className="finance-side-stats">
              <div className="finance-side-stat">
                <span>本月收入</span>
                <strong className="success">¥{thisMonthStats.income.toFixed(2)}</strong>
              </div>
              <div className="finance-side-stat">
                <span>本月支出</span>
                <strong className="danger">¥{thisMonthStats.expense.toFixed(2)}</strong>
              </div>
              <div className="finance-side-stat">
                <span>本月净流入</span>
                <strong className="primary">¥{thisMonthStats.net.toFixed(2)}</strong>
              </div>
              <div className="finance-side-stat">
                <span>本月笔数</span>
                <strong>{thisMonthStats.count}</strong>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function MetricCard({ label, value, emphasis, plain = false }) {
  return (
    <div className="finance-metric-card">
      <span>{label}</span>
      <strong className={emphasis}>
        {plain ? value : `¥${Number(value).toFixed(2)}`}
      </strong>
    </div>
  );
}
