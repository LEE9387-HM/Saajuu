import { describe, expect, it } from "vitest";
import { clearProfile, loadProfile, saveProfile } from "./storage.js";

function memoryStore(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value);
    },
    removeItem: (key) => {
      delete data[key];
    },
    _data: data,
  };
}

const input = {
  calendarType: "solar",
  birthDate: "1992-10-24",
  hour: 5,
  minute: 30,
  isLeapMonth: false,
  topic: "business",
  tone: "balanced",
  name: "김사주",
  concern: "",
};

describe("profile storage", () => {
  it("round-trips a profile with schema version", () => {
    const store = memoryStore();
    expect(saveProfile(input, store)).toBe(true);
    const loaded = loadProfile(store);
    expect(loaded.v).toBe(1);
    expect(loaded.birthDate).toBe("1992-10-24");
    expect(loaded.topic).toBe("business");
  });

  it("clears corrupted JSON instead of throwing", () => {
    const store = memoryStore({ "saajuu:profile": "{broken json" });
    expect(loadProfile(store)).toBeNull();
    expect(store._data["saajuu:profile"]).toBeUndefined();
  });

  it("rejects unknown schema versions", () => {
    const store = memoryStore({ "saajuu:profile": JSON.stringify({ v: 99, birthDate: "x" }) });
    expect(loadProfile(store)).toBeNull();
  });

  it("survives a write-blocked store (private mode)", () => {
    const store = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: () => {},
    };
    expect(saveProfile(input, store)).toBe(false);
  });

  it("clearProfile removes the stored profile", () => {
    const store = memoryStore();
    saveProfile(input, store);
    clearProfile(store);
    expect(loadProfile(store)).toBeNull();
  });
});
