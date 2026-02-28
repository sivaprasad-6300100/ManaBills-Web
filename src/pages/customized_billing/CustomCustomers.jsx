import React, { useEffect, useState } from "react";

const CustomCustomers = () => {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    const bills = JSON.parse(localStorage.getItem("custom_bills")) || [];
    const payments = JSON.parse(localStorage.getItem("custom_payments")) || [];

    const map = {};

    bills.forEach((b) => {
      const key = b.customer.mobile;

      if (!map[key]) {
        map[key] = {
          name: b.customer.name,
          mobile: b.customer.mobile,
          totalBilling: 0,
          totalPaid: 0,
        };
      }

      map[key].totalBilling += Number(b.total) || 0;
    });

    payments.forEach((p) => {
      if (map[p.customer]) {
        map[p.customer].totalPaid += Number(p.amount) || 0;
      }
    });

    const list = Object.values(map).map((c) => ({
      ...c,
      balance: c.totalBilling - c.totalPaid,
    }));

    setCustomers(list);
  }, []);

  return (
    <div className="customers-page">
      <h2>Customers</h2>

      <table className="cust-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Mobile</th>
            <th>Total Billing</th>
            <th>Paid</th>
            <th>Balance</th>
          </tr>
        </thead>

        <tbody>
          {customers.length === 0 ? (
            <tr>
              <td colSpan="5">No customers found</td>
            </tr>
          ) : (
            customers.map((c, i) => (
              <tr key={i}>
                <td>{c.name}</td>
                <td>{c.mobile}</td>
                <td>₹ {c.totalBilling}</td>
                <td>₹ {c.totalPaid}</td>
                <td className={c.balance > 0 ? "danger" : "success"}>
                  ₹ {c.balance}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CustomCustomers;
