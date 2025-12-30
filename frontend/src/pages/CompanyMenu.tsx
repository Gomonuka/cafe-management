import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiInfo, FiMinusCircle, FiPlusCircle } from "react-icons/fi";
import "../styles/companyMenu.css";
import { useCart } from "../cart/CartContext";

type Product = {
  id: number;
  name: string;
  price: number;
  isAvailable: boolean;
};

type Category = {
  id: number;
  name: string;
  description?: string;
  products: Product[];
};

const mock = {
  companyName: 'Restorāns "Tests"',
  categories: [
    {
      id: 1,
      name: "Kategorija 1",
      description: "Apraksts",
      products: [
        { id: 11, name: "Produkts 1", price: 5.5, isAvailable: true },
        { id: 12, name: "Produkts 2", price: 6.0, isAvailable: false },
        { id: 13, name: "Produkts 3", price: 4.2, isAvailable: true },
      ],
    },
    {
      id: 2,
      name: "Kategorija 2",
      description: "Apraksts",
      products: [
        { id: 21, name: "Produkts 4", price: 8.0, isAvailable: true },
        { id: 22, name: "Produkts 5", price: 3.8, isAvailable: true },
        { id: 23, name: "Produkts 6", price: 7.2, isAvailable: true },
      ],
    },
  ] as Category[],
};

export default function CompanyMenu() {
  const nav = useNavigate();
  const { id } = useParams(); // company id (string)
  const { cart, setCompany, add, dec, subtotal } = useCart();

  const categories = mock.categories;
  const companyName = mock.companyName;

  useEffect(() => {
    if (id) setCompany(id);
  }, [id, setCompany]);

  const total = useMemo(() => subtotal, [subtotal]);

  const hasItems = Object.keys(cart.items).length > 0;

  return (
    <div className="cm">
      <div className="cm-top card">
        <button className="cm-back" onClick={() => nav(-1)} type="button" aria-label="Back">
          <FiArrowLeft />
        </button>

        <div className="cm-title">
          <span className="cm-title-main">{companyName}</span>
          <span className="cm-title-sub">Ēdienkarte</span>
        </div>

        <button className="btn btn-primary cm-info-btn" type="button" onClick={() => nav(`/app/companies/${id}`)}>
          <span className="cm-info-ic"><FiInfo /></span>
          Skatīt informāciju
        </button>
      </div>

      <div className="cm-content">
        {categories.map((cat) => (
          <section key={cat.id} className="cm-cat card">
            <div className="cm-cat-head">
              <div className="cm-cat-name">{cat.name}</div>
              <div className="cm-cat-desc">{cat.description}</div>
            </div>

            <div className="cm-grid">
              {cat.products.map((p) => {
                const qty = cart.items[p.id]?.qty || 0;

                return (
                  <div key={p.id} className="cm-prod card">
                    <div className="cm-prod-img" />
                    <div className="cm-prod-name">{p.name}</div>

                    {p.isAvailable ? (
                      <>
                        <div className="cm-stepper">
                          <button
                            className="cm-step-btn"
                            type="button"
                            onClick={() => dec(p.id, 1)}
                            disabled={qty === 0}
                            aria-label="decrease"
                          >
                            <FiMinusCircle />
                          </button>
                          <div className="cm-step-qty">{qty}</div>
                          <button
                            className="cm-step-btn"
                            type="button"
                            onClick={() => add({ productId: p.id, name: p.name, price: p.price }, 1)}
                            aria-label="increase"
                          >
                            <FiPlusCircle />
                          </button>
                        </div>

                        <button
                          className="btn btn-primary cm-add"
                          type="button"
                          onClick={() => add({ productId: p.id, name: p.name, price: p.price }, 1)}
                        >
                          Pievienot
                        </button>
                      </>
                    ) : (
                      <div className="cm-na">Nav pieejams</div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="cm-bottom">
        <div className="cm-bottom-inner">
          <div className="cm-sum">
            <span className="cm-sum-ic">$</span>
            <span>Summa</span>
            <span className="cm-sum-val">{total.toFixed(2)}</span>
          </div>

          <button
            className="btn btn-primary cm-checkout"
            type="button"
            disabled={!hasItems}
            onClick={() => nav(`/app/companies/${id}/checkout`)}
            title={!hasItems ? "Pievienojiet produktus grozam" : "Noformēt pasūtījumu"}
          >
            Noformēt pasūtījumu
          </button>
        </div>
      </div>
    </div>
  );
}
