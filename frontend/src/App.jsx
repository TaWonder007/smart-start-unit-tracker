import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [units, setUnits] = useState([]);
  const [formData, setFormData] = useState({
    property: "",
    unit: "",
    cleaningStatus: "Not Started",
    invoiceStatus: "Not Sent",
    paymentStatus: "Unpaid",
    invoiceAmount: "",
  });

  const fetchUnits = () => {
    axios
      .get("http://127.0.0.1:3001/api/units")
      .then((response) => {
        setUnits(response.data);
      })
      .catch((error) => {
        console.error("Error fetching units:", error);
      });
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    axios
      .post("http://127.0.0.1:3001/api/units", formData)
      .then(() => {
        fetchUnits();

        setFormData({
          property: "",
          unit: "",
          cleaningStatus: "Not Started",
          invoiceStatus: "Not Sent",
          paymentStatus: "Unpaid",
          invoiceAmount: "",
        });
      })
      .catch((error) => {
        console.error("Error adding unit:", error);
      });
  };

  const updateUnitStatus = (id, field, value) => {
    axios
      .patch(`http://127.0.0.1:3001/api/units/${id}`, {
        [field]: value,
      })
      .then(() => {
        fetchUnits();
      })
      .catch((error) => {
        console.error("Error updating unit:", error);
      });
  };

  const deleteUnit = (id) => {
    axios
      .delete(`http://127.0.0.1:3001/api/units/${id}`)
      .then(() => {
        fetchUnits();
      })
      .catch((error) => {
        console.error("Error deleting unit:", error);
      });
  };

  const getStatusClass = (type, value) => {
    if (type === "cleaning") {
      if (value === "Completed") return "status-badge status-completed";
      if (value === "In Progress") return "status-badge status-inprogress";
      return "status-badge status-default";
    }

    if (type === "invoice") {
      if (value === "Sent") return "status-badge status-sent";
      if (value === "Paid Pending") return "status-badge status-pending";
      return "status-badge status-default";
    }

    if (type === "payment") {
      if (value === "Paid") return "status-badge status-paid";
      if (value === "Partially Paid") return "status-badge status-partial";
      return "status-badge status-unpaid";
    }

    return "status-badge status-default";
  };

  const totalUnits = units.length;
  const unpaidUnits = units.filter((u) => u.paymentStatus !== "Paid").length;
  const paidUnits = units.filter((u) => u.paymentStatus === "Paid").length;

  const totalOutstanding = units
    .filter((u) => u.paymentStatus !== "Paid")
    .reduce((sum, u) => sum + Number(u.invoiceAmount || 0), 0);

  return (
    <div className="app">
      <h1>Smart Start Unit Tracker</h1>
      <p className="subtitle">Track units from cleaning through payment.</p>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Total Units</h3>
          <p>{totalUnits}</p>
        </div>

        <div className="dashboard-card">
          <h3>Unpaid Units</h3>
          <p>{unpaidUnits}</p>
        </div>

        <div className="dashboard-card">
          <h3>Paid Units</h3>
          <p>{paidUnits}</p>
        </div>

        <div className="dashboard-card">
          <h3>Outstanding Balance</h3>
          <p>${totalOutstanding.toFixed(2)}</p>
        </div>
      </div>

      <form className="unit-form" onSubmit={handleSubmit}>
        <h2>Add New Unit</h2>

        <input
          type="text"
          name="property"
          placeholder="Property Name"
          value={formData.property}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="unit"
          placeholder="Unit Number"
          value={formData.unit}
          onChange={handleChange}
          required
        />

        <input
          type="number"
          name="invoiceAmount"
          placeholder="Invoice Amount"
          value={formData.invoiceAmount}
          onChange={handleChange}
          required
        />

        <select
          name="cleaningStatus"
          value={formData.cleaningStatus}
          onChange={handleChange}
        >
          <option>Not Started</option>
          <option>In Progress</option>
          <option>Completed</option>
        </select>

        <select
          name="invoiceStatus"
          value={formData.invoiceStatus}
          onChange={handleChange}
        >
          <option>Not Sent</option>
          <option>Sent</option>
          <option>Paid Pending</option>
        </select>

        <select
          name="paymentStatus"
          value={formData.paymentStatus}
          onChange={handleChange}
        >
          <option>Unpaid</option>
          <option>Partially Paid</option>
          <option>Paid</option>
        </select>

        <button type="submit">Add Unit</button>
      </form>

      <div className="units-section">
        <h2>Assigned Units</h2>

        {units.map((unit) => (
          <div key={unit.id} className="unit-card">
            <h3>
              {unit.property} – Unit {unit.unit}
            </h3>

            <p>
              <strong>Invoice Amount:</strong> $
              {Number(unit.invoiceAmount || 0).toFixed(2)}
            </p>

            <p>
              <strong>Cleaning:</strong>{" "}
              <span
                className={getStatusClass("cleaning", unit.cleaningStatus)}
              >
                {unit.cleaningStatus}
              </span>
            </p>

            <p>
              <strong>Invoice:</strong>{" "}
              <span className={getStatusClass("invoice", unit.invoiceStatus)}>
                {unit.invoiceStatus}
              </span>
            </p>

            <p>
              <strong>Payment:</strong>{" "}
              <span className={getStatusClass("payment", unit.paymentStatus)}>
                {unit.paymentStatus}
              </span>
            </p>

            <div className="button-group">
              <button
                onClick={() =>
                  updateUnitStatus(unit.id, "cleaningStatus", "Completed")
                }
              >
                Mark Cleaned
              </button>

              <button
                onClick={() =>
                  updateUnitStatus(unit.id, "invoiceStatus", "Sent")
                }
              >
                Invoice Sent
              </button>

              <button
                onClick={() =>
                  updateUnitStatus(unit.id, "paymentStatus", "Paid")
                }
              >
                Paid
              </button>
            </div>

            <div className="unit-actions">
              <button
                className="delete-button"
                onClick={() => deleteUnit(unit.id)}
              >
                Clear Entry
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;