import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import CalendarComponent from "../components/CalendarComponent";
import Layout from "../components/Layout";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    async function fetchEvents() {
      const url = `${API_BASE}/api/events?limit=3&order=desc`;
      console.log("👉 Fetching events from:", url);
      try {
        const response = await fetch(url, { headers: { Accept: "application/json" } });
        console.log("← Status:", response.status, response.statusText);

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get("content-type") || "";
        console.log("← Content-Type:", contentType);

        if (!contentType.includes("application/json")) {
          const text = await response.text();
          console.error("← Raw response body:", text);
          throw new Error(
            "Backend did not return JSON. First 120 chars: " + text.slice(0, 120)
          );
        }

        const data = await response.json();
        console.log("← Parsed JSON data:", data);
        setEvents(data);
      } catch (err) {
        console.error("❌ fetchEvents error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [API_BASE]);

  return (
    <Layout>
      <div style={{ padding: "1rem" }}>
        <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        
          Events Page
        </h1>
        <p>Below are your three most recent events.</p>

        {loading && <p>Loading latest events…</p>}
        {error && <p style={{ color: "crimson" }}>Error: {error}</p>}

        {!loading && !error && (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {events.length === 0 && (
              <li style={{ marginBottom: "1rem" }}>No recent events found.</li>
            )}
            {events.map((evt) => (
              <li
                key={evt.id}
                style={{
                  border: "1px solid #e2e2e2",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "12px",
                }}
              >
                <h2 style={{ margin: "0 0 4px" }}>{evt.title}</h2>
                <small style={{ color: "#666" }}>
                  {new Date(evt.event_date || evt.date || evt.created_at).toLocaleDateString()}
                </small>
                <p style={{ marginTop: "8px" }}>{evt.description}</p>
              </li>
            ))}
          </ul>
        )}

    
        <CalendarComponent />

        <Link to="/events/createevent">
          <button
            style={{
              padding: "10px 20px",
              backgroundColor: "#ff8937",
              border: "none",
              color: "white",
              fontWeight: "bold",
              borderRadius: "8px",
              cursor: "pointer",
              marginTop: "20px",
            }}
          >
            + Create New Event
          </button>
        </Link>
      </div>
    </Layout>
  );
}
