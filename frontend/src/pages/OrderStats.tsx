import { useEffect, useMemo, useState } from "react";
import Card from "../components/ui/Card";
import { fetchOrderStats, type OrderStats } from "../api/orders";
import "../styles/menu.css";

export default function OrderStats() {
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrderStats().then((res) => {
      if (res.ok) setStats(res.data);
      else setError(res.data?.detail || "Neizdevās ielādēt statistiku.");
    });
  }, []);

  const maxSales = useMemo(() => {
    if (!stats || stats.sales_by_day.length === 0) return 0;
    return Math.max(...stats.sales_by_day.map((s) => Number(s.total)));
  }, [stats]);

  const barHeight = (val: number) => {
    if (!maxSales) return 0;
    const h = (val / maxSales) * 160;
    return Math.max(8, Math.min(160, h));
  };

  return (
    <div className="profile-wrap" style={{ alignItems: "stretch" }}>
      <div className="page-heading">Statistika</div>
      {error && <div style={{ color: "red", padding: 12 }}>{error}</div>}

      {stats && (
        <>
          <div className="stats-cards">
            <Card className="stats-card center">
              <div className="stats-card-title">Pasūtījumu skaits</div>
              <div className="stats-card-value center">{stats.total_orders}</div>
            </Card>
            <Card className="stats-card center">
              <div className="stats-card-title">Vidējā pasūtījuma summa</div>
              <div className="stats-card-value center">
                {Number(stats.avg_order_amount).toFixed(2)} €
              </div>
            </Card>
            <Card className="stats-card center">
              <div className="stats-card-title">Populārākais produkts</div>
              <div className="stats-card-value small center">
                {stats.most_popular_product?.product__name || "Nav datu"}
              </div>
              <div className="stats-card-sub">
                {stats.most_popular_product
                  ? `${stats.most_popular_product.total_qty} vienības`
                  : ""}
              </div>
            </Card>
          </div>

          <Card className="stats-block">
            <div className="stats-block-title">Top produkti</div>
            {stats.top_products.length === 0 && <div className="stats-empty">Nav datu</div>}
            {stats.top_products.map((p) => (
              <div key={p.product_id} className="stats-row">
                <span>{p.product__name}</span>
                <span>{p.total_qty} vienības</span>
              </div>
            ))}
          </Card>

          <Card className="stats-block">
            <div className="stats-block-title">Produktu pārdošanas grafiks</div>
            {stats.sales_by_day.length === 0 ? (
              <div className="stats-empty">Nav datu</div>
            ) : (
              <div className="stats-chart-wrapper">
                <div className="stats-chart-y">€</div>
                <div className="stats-chart">
                  {stats.sales_by_day.map((s, idx) => {
                    const totalNum = Number(s.total);
                    return (
                      <div key={idx} className="stats-bar">
                        <div
                          className="stats-bar-fill"
                          style={{ height: `${barHeight(totalNum)}px` }}
                          title={`${s.d}: ${totalNum.toFixed(2)} €`}
                        />
                        <div className="stats-bar-label">{s.d}</div>
                        <div className="stats-bar-value">{totalNum.toFixed(2)} €</div>
                      </div>
                    );
                  })}
                </div>
                <div className="stats-chart-x">Dienas</div>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
