import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiMinusCircle, FiPlusCircle, FiTrash2 } from "react-icons/fi";
import "../styles/createOrder.css";
import { useCart } from "../cart/CartContext";

const VAT_RATE = 0.21;

export default function CreateOrder() {
  const nav = useNavigate();
  const { id } = useParams(); // company id
  const { cart, setCompany, add, dec, remove, subtotal, clear } = useCart();

  useEffect(() => {
    if (id) setCompany(id);
  }, [id, setCompany]);

  const items = useMemo(() => Object.values(cart.items), [cart.items]);

  const [orderType, setOrderType] = useState<"on_site" | "takeaway">("takeaway");
  const [note, setNote] = useState("");

  const companyName = 'Restorāns "Tests"';

  const vat = useMemo(() => Math.round(subtotal * VAT_RATE * 100) / 100, [subtotal]);
  const total = useMemo(() => Math.round(subtotal * 100) / 100, [subtotal]); // как на фигме
  const canSubmit = items.length > 0;

  const submit = () => {
    // TODO: API call
    alert("Pasūtījums izveidots! (mock)");
    clear();
    nav(`/app/my-orders`);
  };

  return (
    <div className="co">
      <div className="co-top card">
        <button className="co-back" onClick={() => nav(-1)} type="button" aria-label="Back">
          <FiArrowLeft />
        </button>

        <div className="co-title">
          <span className="co-title-main">{companyName}</span>
          <span className="co-title-sub">Pasūtījums</span>
        </div>
      </div>

      <div className="co-grid">
        <section className="co-left card">
          <div className="co-h">Pasūtījuma saturs</div>

          <div className="co-items">
            {items.map((it) => {
              const rowSum = it.price * it.qty;

              return (
                <div key={it.productId} className="co-item">
                  <div className="co-item-name">{it.name}</div>

                  <div className="co-stepper">
                    <button className="co-step-btn" type="button" onClick={() => dec(it.productId, 1)} aria-label="minus">
                      <FiMinusCircle />
                    </button>
                    <div className="co-qty">{it.qty}</div>
                    <button
                      className="co-step-btn"
                      type="button"
                      onClick={() => add({ productId: it.productId, name: it.name, price: it.price }, 1)}
                      aria-label="plus"
                    >
                      <FiPlusCircle />
                    </button>
                  </div>

                  <div className="co-price">{rowSum.toFixed(0)} €</div>

                  <button className="co-trash" type="button" onClick={() => remove(it.productId)} aria-label="remove">
                    <FiTrash2 />
                  </button>
                </div>
              );
            })}

            {items.length === 0 && <div className="co-empty">Grozs ir tukšs</div>}
          </div>
        </section>

        <section className="co-right card">
          <div className="co-h">Pasūtījuma detaļas</div>

          <div className="co-block">
            <div className="co-block-title">Pasūtījuma veids</div>

            <label className="co-radio">
              <input
                type="radio"
                name="orderType"
                checked={orderType === "on_site"}
                onChange={() => setOrderType("on_site")}
              />
              <span className="co-radio-dot" />
              <span>Uz vietas</span>
            </label>

            <label className="co-radio">
              <input
                type="radio"
                name="orderType"
                checked={orderType === "takeaway"}
                onChange={() => setOrderType("takeaway")}
              />
              <span className="co-radio-dot" />
              <span>Līdzņemšanai</span>
            </label>
          </div>

          <div className="co-block">
            <div className="co-block-title">Piezīmes</div>
            <textarea className="co-note" value={note} onChange={(e) => setNote(e.target.value)} rows={4} />
          </div>

          <div className="co-block">
            <div className="co-block-title">Kopsavilkums</div>

            <div className="co-sum">
              <div className="co-sum-row">
                <span>Starpsumma:</span>
                <span>{subtotal.toFixed(0)} €</span>
              </div>
              <div className="co-sum-row">
                <span>PVN (21%):</span>
                <span>{vat.toFixed(2)} €</span>
              </div>
              <div className="co-sum-row total">
                <span>Kopā:</span>
                <span>{total.toFixed(0)} €</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <button className="btn btn-primary co-submit" type="button" disabled={!canSubmit} onClick={submit}>
        Noformēt pasūtījumu
      </button>
    </div>
  );
}
