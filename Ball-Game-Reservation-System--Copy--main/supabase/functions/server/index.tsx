import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use('*', logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

const BASE_ROUTE = "/make-server-ce0562bb";

// Courts Management
app.get(`${BASE_ROUTE}/courts`, async (c) => {
  try {
    const courts = await kv.getByPrefix("court:");
    if (courts.length === 0) {
      // Seed default courts if none exist
      const defaultCourts = [
        { id: 1, name: "Court 1", type: "Outdoor", status: "Active", surface: "Hard", hours: "06:00 - 22:00", rate: 25 },
        { id: 2, name: "Court 2", type: "Outdoor", status: "Maintenance", surface: "Hard", hours: "06:00 - 22:00", rate: 25 },
        { id: 3, name: "Court 3", type: "Indoor", status: "Active", surface: "Cushioned", hours: "08:00 - 23:00", rate: 35 },
        { id: 4, name: "Court 4", type: "Indoor", status: "Active", surface: "Cushioned", hours: "08:00 - 23:00", rate: 35 },
      ];
      await kv.mset(defaultCourts.map(ct => `court:${ct.id}`), defaultCourts);
      return c.json(defaultCourts);
    }
    return c.json(courts);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// Bookings
app.get(`${BASE_ROUTE}/bookings`, async (c) => {
  try {
    const bookings = await kv.getByPrefix("booking:");
    return c.json(bookings);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

app.post(`${BASE_ROUTE}/bookings`, async (c) => {
  try {
    const booking = await c.req.json();
    const id = `bk-${Date.now()}`;
    const bookingWithId = { ...booking, id };
    
    // Simple conflict check: key by courtId and slot
    const slotKey = `slot:${booking.courtId}:${booking.date}:${booking.time}`;
    const existing = await kv.get(slotKey);
    
    if (existing) {
      return c.json({ error: "Slot already booked" }, 409);
    }
    
    await kv.set(`booking:${id}`, bookingWithId);
    await kv.set(slotKey, { bookingId: id });
    
    return c.json(bookingWithId);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

app.get(`${BASE_ROUTE}/health`, (c) => c.json({ status: "ok" }));

Deno.serve(app.fetch);
