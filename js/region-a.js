(function () {
  "use strict";

  var originalData = [];
  var filteredData = [];
  var districtChart = null;

  function byId(id) {
    return document.getElementById(id);
  }

  function toNumber(value) {
    var num = Number(value);
    return Number.isFinite(num) ? num : 0;
  }

  function getOctopusStatus(item) {
    return String(item.octopus_payment_yn || "").trim().toUpperCase() === "Y" ? "Y" : "N";
  }

  function isChain(item) {
    var type = String(item.chain_type || "").trim().toLowerCase();
    return type !== "" && type !== "independent / others";
  }

  function formatPercent(numerator, denominator) {
    if (!denominator) return "0%";
    return Math.round((numerator / denominator) * 100) + "%";
  }

  function getCurrentFilters() {
    return {
      district: byId("districtFilter").value,
      chainType: byId("chainFilter").value,
      octopus: byId("octopusFilter").value,
      minRating: toNumber(byId("ratingMin").value)
    };
  }

  function applyFilters(data, filters) {
    return data.filter(function (item) {
      if (filters.district !== "all" && item.district_18 !== filters.district) return false;
      if (filters.chainType === "chain" && !isChain(item)) return false;
      if (filters.chainType === "independent" && isChain(item)) return false;
      if (filters.octopus !== "all" && getOctopusStatus(item) !== filters.octopus) return false;
      if (toNumber(item.google_rating) < filters.minRating) return false;
      return true;
    });
  }

  function updateStats(data) {
    var total = data.length;
    var octopusCount = data.filter(function (item) {
      return getOctopusStatus(item) === "Y";
    }).length;
    var rated = data.filter(function (item) {
      return toNumber(item.google_rating) > 0;
    });
    var ratingSum = rated.reduce(function (sum, item) {
      return sum + toNumber(item.google_rating);
    }, 0);
    var chainCount = data.filter(isChain).length;

    byId("totalCount").textContent = total.toLocaleString("en-US");
    byId("octopusRate").textContent = formatPercent(octopusCount, total);
    byId("avgRating").textContent = rated.length ? (ratingSum / rated.length).toFixed(1) : "-";
    byId("chainCount").textContent = chainCount.toLocaleString("en-US");
    byId("chartSubtitle").textContent = total.toLocaleString("en-US") + " merchants in current view";
  }

  function buildDistrictSeries(data) {
    var counts = {};
    data.forEach(function (item) {
      var district = item.district_18 || "Unknown";
      counts[district] = (counts[district] || 0) + 1;
    });

    return Object.keys(counts)
      .map(function (district) {
        return { district: district, count: counts[district] };
      })
      .sort(function (a, b) {
        return b.count - a.count || a.district.localeCompare(b.district);
      });
  }

  function updateDistrictChart(data) {
    var chartEl = byId("districtChart");
    var series = buildDistrictSeries(data);
    var districts = series.map(function (row) {
      return row.district;
    });
    var counts = series.map(function (row) {
      return row.count;
    });

    if (!window.echarts) {
      renderFallbackDistrictChart(chartEl, series);
      return;
    }

    if (!districtChart) {
      districtChart = echarts.init(chartEl);
      window.addEventListener("resize", function () {
        districtChart.resize();
      });
    }

    districtChart.setOption({
      animationDuration: 350,
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: function (params) {
          var item = params[0];
          return item.name + "<br>Merchants: " + item.value;
        }
      },
      grid: { left: 42, right: 16, top: 18, bottom: 46, containLabel: true },
      xAxis: {
        type: "category",
        data: districts,
        axisTick: { alignWithLabel: true },
        axisLabel: {
          color: "#475569",
          fontSize: 11,
          interval: 0,
          rotate: districts.length > 5 ? -25 : 0
        }
      },
      yAxis: {
        type: "value",
        name: "Merchants",
        nameTextStyle: { color: "#64748b", padding: [0, 0, 4, 0] },
        axisLabel: { color: "#64748b" },
        splitLine: { lineStyle: { color: "#e8edf3", type: "dashed" } }
      },
      series: [
        {
          name: "Merchants",
          type: "bar",
          data: counts,
          barWidth: "58%",
          itemStyle: {
            borderRadius: [5, 5, 0, 0],
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "#2c7fb8" },
                { offset: 1, color: "#1e5a96" }
              ]
            }
          },
          emphasis: {
            itemStyle: { color: "#1f9d72" }
          }
        }
      ]
    });

    districtChart.off("click");
    districtChart.on("click", function (params) {
      if (params.componentType !== "series") return;
      byId("districtFilter").value = districts[params.dataIndex];
      applyFiltersAndNotify();
    });
  }

  function renderFallbackDistrictChart(chartEl, series) {
    if (districtChart) {
      districtChart.dispose();
      districtChart = null;
    }

    var max = series.reduce(function (largest, row) {
      return Math.max(largest, row.count);
    }, 1);
    var html = series
      .map(function (row) {
        var width = Math.max(6, Math.round((row.count / max) * 100));
        return (
          '<button type="button" class="district-fallback-bar" data-district="' +
          row.district.replace(/"/g, "&quot;") +
          '">' +
          '<span class="district-name">' +
          row.district +
          "</span>" +
          '<span class="district-meter"><span style="width:' +
          width +
          '%"></span></span>' +
          '<strong>' +
          row.count +
          "</strong>" +
          "</button>"
        );
      })
      .join("");

    chartEl.innerHTML = '<div class="district-fallback-chart">' + html + "</div>";
    chartEl.querySelectorAll(".district-fallback-bar").forEach(function (button) {
      button.addEventListener("click", function () {
        byId("districtFilter").value = button.getAttribute("data-district");
        applyFiltersAndNotify();
      });
    });
  }

  function notifyParent(filters) {
    window.parent.postMessage(
      {
        type: "FILTER_CHANGE",
        filters: filters,
        total: filteredData.length
      },
      "*"
    );
  }

  function applyFiltersAndNotify() {
    var filters = getCurrentFilters();
    filteredData = applyFilters(originalData, filters);
    updateStats(filteredData);
    updateDistrictChart(filteredData);
    notifyParent(filters);
  }

  function populateDistrictFilter(data) {
    var counts = buildDistrictSeries(data);
    var select = byId("districtFilter");
    counts.forEach(function (row) {
      var option = document.createElement("option");
      option.value = row.district;
      option.textContent = row.district;
      select.appendChild(option);
    });
  }

  function bindEvents() {
    byId("districtFilter").addEventListener("change", applyFiltersAndNotify);
    byId("chainFilter").addEventListener("change", applyFiltersAndNotify);
    byId("octopusFilter").addEventListener("change", applyFiltersAndNotify);
    byId("ratingMin").addEventListener("input", applyFiltersAndNotify);
    byId("resetBtn").addEventListener("click", function () {
      byId("districtFilter").value = "all";
      byId("chainFilter").value = "all";
      byId("octopusFilter").value = "all";
      byId("ratingMin").value = "0";
      applyFiltersAndNotify();
    });
  }

  window.initRegionA = function (data) {
    originalData = Array.isArray(data) ? data : [];
    populateDistrictFilter(originalData);
    bindEvents();
    applyFiltersAndNotify();
  };
})();
