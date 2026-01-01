import { useEffect, useState } from "react";
import Card from "../components/ui/Card";
import { fetchOrderStats, type OrderStats } from "../api/orders";

export default function OrderStats() {
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrderStats().then((res) => {
      if (res.ok) setStats(res.data);
      else setError(res.data?.detail || "Neizdevas ieladet statistiku.");
    });
  }, []);

  return (
    <div className="profile-wrap" style={{ alignItems: "stretch" }}>
      <div className="page-heading">Statistika</div>
      {error && <div style={{ color: "red", padding: 12 }}>{error}</div>}
      {stats && (
        <div className="order-grid">
          <Card>
            <div className="profile-title" style={{ margin: 0 }}>
              Pasutijumu skaits
            </div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{stats.total_orders}</div>
          </Card>
          <Card>
            <div className="profile-title" style={{ margin: 0 }}>
              Videja summa
            </div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{stats.avg_order_amount} €</div>
          </Card>
          <Card>
            <div className="profile-title" style={{ margin: 0 }}>
              Popularakais produkts
            </div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>
              {stats.most_popular_product?.product__name || "—"}
            </div>
            <div>
              {stats.most_popular_product
                ? `${stats.most_popular_product.total_qty} vienibas`
                : "Nav datu"}
            </div>
          </Card>
        </div>
      )}

      {stats && (
        <Card style={{ marginTop: 12 }}>
          <div className="profile-title" style={{ margin: "0 0 8px" }}>
            Top produkti
          </div>
          {stats.top_products.length === 0 && <div>Nav datu</div>}
          {stats.top_products.map((p) => (
            <div key={p.product_id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
              <span>{p.product__name}</span>
              <span>{p.total_qty} vienibas</span>
            </div>
          ))}
        </Card>
      )}

      {stats && (
        <Card style={{ marginTop: 12 }}>
          <div className="profile-title" style={{ margin: "0 0 8px" }}>
            Pardosanas pa dienam
          </div>
          {stats.sales_by_day.length === 0 && <div>Nav datu</div>}
          {stats.sales_by_day.map((r, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
              <span>{r.d}</span>
              <span>{r.total} €</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
