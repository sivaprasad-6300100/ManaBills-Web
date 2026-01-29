import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { SubscriptionContext } from "../../context/SubscriptionContext";
// import '../../styles/subscription.css'

const CustomSubscription = () => {
  const navigate = useNavigate();
  const { subscriptions, subscribe } = useContext(SubscriptionContext);

  const plans = [
    {
      key: "custom",
      name: "FREE",
      price:  "₹0",
       tag: "3 Days Free",
      duration: "No card required",
      highlight: false,
      features: [
        "Custom billing formats",
        "Custom estimates",
        "Advanced reports",
        "Flexible workflows",
      ],
      action:() => navigate("/dashboard/custom"),
      btnText:"start Free Trial"
    },
    {
       key: "custom_basic",
       name: "BASIC",
       price:  "₹199",
       tag: "Best for Small Shops",
       duration: "per month",
       highlight: true,
       features: [
         "Custom billing formats",
         "Custom estimates",
         "Advanced reports",
         "Flexible workflows",
       ],
       action:() => navigate("/subscription/checkout",{
        state: { planKey: "custom_basic" },
       }),
       btnText:"choose Basic"
    },
    {
      key :"custom_pro",
      name:"PRO",
      tag: "Growing Business",
      price: "₹499",
      duration: "per month",
      highlight: false,
      features: [
        "Custom billing formats",
        "Custom estimates",
        "Advanced reports",
        "Flexible workflows",
        "Priority support",
      ],
      action:() => navigate("/subscription/checkout",{
        state: { planKey: "custom_pro" },
       }),
       btnText:"choose Pro"
    },
  ];


  return (
    <div className="subscription-wrapper">
      {plans.map((plan)=>(
        <div
          key={plan.key}
          className={`plan-card ${plan.highlight ? "highlight" : ""}`}
          >
          <h3 className="plan-title">{plan.name}</h3>
          <span className="plan-tag">{plan.tag}</span>


          <div className="plan-price">{plan.price}</div>
          <div className="plan-duration">{plan.duration}</div>

          <ul className="plan-features">
              {plan.features.map((f,i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>

            <button
              className="plan-btn"
              onClick={() => plan.action()}>
              {plan.btnText}
            </button>
        </div>
      ))}
    </div>
  );
};

  
  
  

export default CustomSubscription;
