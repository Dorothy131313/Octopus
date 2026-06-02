(function () {
  "use strict";

  function normalizeValue(value) {
    if (value === undefined || value === null) return null;
    if (typeof value === "number" && Number.isNaN(value)) return null;
    return value;
  }

  function normalizeRecord(record) {
    var out = {};
    Object.keys(record).forEach(function (key) {
      out[key] = normalizeValue(record[key]);
    });
    return out;
  }

  function loadData() {
    return fetch("data.json", { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Failed to load data.json: " + response.status);
        }
        return response.json();
      })
      .then(function (rows) {
        return rows.map(normalizeRecord);
      });
  }

  window.loadPharmacyData = loadData;

  document.addEventListener("DOMContentLoaded", function () {
    loadData()
      .then(function (data) {
        if (typeof window.initRegionA === "function") {
          window.initRegionA(data);
        }
        if (typeof window.renderRegionB === "function") {
          window.renderRegionB(data);
        }
        if (typeof window.renderRegionC === "function") {
          window.renderRegionC(data);
        }
      })
      .catch(function (error) {
        console.error(error);
        document.body.insertAdjacentHTML(
          "afterbegin",
          '<div style="padding:12px;color:#991b1b;background:#fee2e2;">Data loading failed.</div>'
        );
      });
  });
})();
