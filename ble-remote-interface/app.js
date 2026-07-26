(function () {
  "use strict";

  const SERVICE_UUID = "aa5b666d-b1e2-469a-803a-7c0526633021";

  const CHARS = {
    mode:              { uuid: "dd3b5387-9745-4deb-84e9-5c0fdb5712c8", type: "uint8",  notify: true },
    brightness:        { uuid: "b55e5501-737c-4bdd-90f5-7a20d809023e", type: "uint8"  },
    hue:               { uuid: "05161b8c-de23-424e-b466-71b3df5498c6", type: "int16"  },
    vuCeilingMin:      { uuid: "0cc0238f-402e-4663-ae0c-f183284186f9", type: "float32" },
    vuCeilingDecay:    { uuid: "9275cd4f-3aa7-4c5f-84e4-ef4ec726d76c", type: "float32" },
    vuCeilingHeadroom: { uuid: "e0a401c7-9841-474e-89ae-ccaeba79c72d", type: "float32" },
    vuFloorMax:        { uuid: "5265c037-4a0a-4813-81f8-be08ce0bf8e3", type: "float32" },
    vuFloorRecovery:   { uuid: "eda42e0a-fcf3-4d3f-9078-81b456b285ae", type: "float32" },
    beatBaselineAlpha: { uuid: "01044ad9-4df0-4220-9809-eb628cd1d669", type: "float32" },
    beatOnsetFactor:   { uuid: "01405f8d-2bc9-404b-a708-2d59be5ebf09", type: "float32" },
    beatAbsFloor:      { uuid: "ff40d383-a891-4ffb-9168-27fa2ca70bcf", type: "float32" },
    beatSilenceFloor:  { uuid: "b6348c88-6548-4a9f-8b98-06e4507b95aa", type: "float32" },
    beatSilenceMs:     { uuid: "3492147d-9ec4-4e9b-ac99-0b38e80c0c61", type: "uint32" },
    beatTimeoutMs:     { uuid: "0ee3fc7a-cd43-4bf4-91cf-4dbea4120860", type: "uint32" },
  };

  const state = {
    device: null,
    characteristics: {},
    connected: false,
  };

  const el = {
    connectBtn: document.getElementById("connectBtn"),
    statusDot: document.getElementById("statusDot"),
    statusMessage: document.getElementById("statusMessage"),
    modeGrid: document.getElementById("modeGrid"),
    brightnessSlider: document.getElementById("brightnessSlider"),
    brightnessValue: document.getElementById("brightnessValue"),
    hueSlider: document.getElementById("hueSlider"),
    hueValue: document.getElementById("hueValue"),
  };

  let messageTimer = null;
  function showMessage(text) {
    el.statusMessage.textContent = text;
    el.statusMessage.classList.add("visible");
    clearTimeout(messageTimer);
    messageTimer = setTimeout(() => {
      el.statusMessage.classList.remove("visible");
    }, 4000);
  }

  function encode(type, value) {
    let buf, view;
    switch (type) {
      case "uint8":
        buf = new ArrayBuffer(1); view = new DataView(buf); view.setUint8(0, value); break;
      case "int16":
        buf = new ArrayBuffer(2); view = new DataView(buf); view.setInt16(0, value, true); break;
      case "uint32":
        buf = new ArrayBuffer(4); view = new DataView(buf); view.setUint32(0, value, true); break;
      case "float32":
        buf = new ArrayBuffer(4); view = new DataView(buf); view.setFloat32(0, value, true); break;
    }
    return buf;
  }

  function decode(type, dataview) {
    switch (type) {
      case "uint8": return dataview.getUint8(0);
      case "int16": return dataview.getInt16(0, true);
      case "uint32": return dataview.getUint32(0, true);
      case "float32": return dataview.getFloat32(0, true);
    }
  }

  function applyValueToUI(key, value) {
    if (key === "mode") {
      el.modeGrid.querySelectorAll(".mode-btn").forEach((btn) => {
        btn.classList.toggle("active", Number(btn.dataset.mode) === value);
      });
      return;
    }
    if (key === "brightness") {
      const pct = Math.round((value * 100) / 255);
      el.brightnessSlider.value = pct;
      el.brightnessValue.textContent = pct + "%";
      return;
    }
    if (key === "hue") {
      el.hueSlider.value = value;
      el.hueValue.textContent = value + "°";
      return;
    }
    const field = document.querySelector('input[data-key="' + key + '"]');
    if (field) field.value = value;
  }

  async function writeAndRefresh(key, value) {
    const def = CHARS[key];
    const char = state.characteristics[key];
    if (!char) return;
    try {
      await char.writeValue(encode(def.type, value));
      if (key !== "mode") {
        const dv = await char.readValue();
        applyValueToUI(key, decode(def.type, dv));
      }
    } catch (err) {
      showMessage("Write failed: " + err.message);
    }
  }

  function setConnected(isConnected) {
    state.connected = isConnected;
    document.body.classList.toggle("disconnected", !isConnected);
    el.statusDot.classList.toggle("connected", isConnected);
    el.connectBtn.textContent = isConnected ? "Disconnect" : (state.device ? "Reconnect" : "Connect");
  }

  function onDisconnected() {
    setConnected(false);
    showMessage("Disconnected from Ballerwagen.");
  }

  async function seedAllValues() {
    for (const key in CHARS) {
      const def = CHARS[key];
      const char = state.characteristics[key];
      const dv = await char.readValue();
      applyValueToUI(key, decode(def.type, dv));
    }
  }

  async function subscribeMode() {
    const char = state.characteristics.mode;
    await char.startNotifications();
    char.addEventListener("characteristicvaluechanged", (e) => {
      applyValueToUI("mode", decode("uint8", e.target.value));
    });
  }

  async function gattConnect() {
    const server = await state.device.gatt.connect();
    const service = await server.getPrimaryService(SERVICE_UUID);
    state.characteristics = {};
    for (const key in CHARS) {
      state.characteristics[key] = await service.getCharacteristic(CHARS[key].uuid);
    }
    await seedAllValues();
    await subscribeMode();
    setConnected(true);
  }

  async function connect() {
    if (!navigator.bluetooth) {
      showMessage("Web Bluetooth isn't supported in this browser. Use Chrome on Android.");
      return;
    }
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [SERVICE_UUID] }],
      });
      state.device = device;
      device.addEventListener("gattserverdisconnected", onDisconnected);
      await gattConnect();
    } catch (err) {
      if (err.name !== "NotFoundError") {
        showMessage("Connection failed: " + err.message);
      }
    }
  }

  async function reconnect() {
    try {
      await gattConnect();
    } catch (err) {
      showMessage("Reconnect failed: " + err.message);
    }
  }

  el.connectBtn.addEventListener("click", () => {
    if (state.connected) {
      state.device.gatt.disconnect();
    } else if (state.device) {
      reconnect();
    } else {
      connect();
    }
  });

  el.modeGrid.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.mode);
      applyValueToUI("mode", idx);
      writeAndRefresh("mode", idx);
    });
  });

  el.brightnessSlider.addEventListener("input", () => {
    el.brightnessValue.textContent = el.brightnessSlider.value + "%";
  });
  el.brightnessSlider.addEventListener("change", () => {
    const pct = Number(el.brightnessSlider.value);
    writeAndRefresh("brightness", Math.round((pct * 255) / 100));
  });

  el.hueSlider.addEventListener("input", () => {
    el.hueValue.textContent = el.hueSlider.value + "°";
  });
  el.hueSlider.addEventListener("change", () => {
    writeAndRefresh("hue", Number(el.hueSlider.value));
  });

  document.querySelectorAll('input[type="number"][data-key]').forEach((field) => {
    field.addEventListener("change", () => {
      const value = Number(field.value);
      if (Number.isNaN(value)) return;
      writeAndRefresh(field.dataset.key, value);
    });
    field.addEventListener("keydown", (e) => {
      if (e.key === "Enter") field.blur();
    });
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
