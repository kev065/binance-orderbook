import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const OrderBook = () => {
  const chartRef = useRef(null);
  const orderBookChartRef = useRef(null); // Use useRef to store the chart instance

  useEffect(() => {
    // Binance.US config
    const config = {
      symbol: "btcusdt",
      depthUrl: "https://api.binance.us/api/v3/depth",
      depthLimit: "1000",
      wsAddress: "wss://stream.binance.us:9443/ws",
      wsSpeed: "1000ms",
    };

    // Initial order book data
    let lastUpdateId = null;
    let askDict = new Map();
    let bidDict = new Map();
    const wsDataQueue = [];

    // Initial chart creation
    const ctx = chartRef.current.getContext("2d");
    if (orderBookChartRef.current) {
      orderBookChartRef.current.destroy(); // Destroy the existing chart if it exists
    }
    orderBookChartRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: [],
        datasets: [
          {
            label: "Asks",
            data: [],
            backgroundColor: "rgba(255, 0, 0, 0.5)",
          },
          {
            label: "Bids",
            data: [],
            backgroundColor: "rgba(0, 255, 0, 0.5)",
          },
        ],
      },
      options: {
        indexAxis: "y",
        scales: {
          x: {
            stacked: true,
            title: {
              display: true,
              text: "Total Size",
              color: "#ffffff",
            },
            ticks: {
              color: "#cccccc",
            },
          },
          y: {
            beginAtZero: true,
            stacked: true,
            title: {
              display: true,
              text: "Price",
              color: "#ffffff",
            },
            ticks: {
              color: "#cccccc",
            },
          },
        },
        plugins: {
          legend: {
            title: {
              display: true,
              text: config.symbol.toUpperCase(),
              color: "#ffffff",
              padding: {
                top: 15,
              },
              font: {
                size: 18,
              },
            },
            labels: {
              color: "#ffffff", // Ensures the legend is visible against a dark background
            },
          },
        },
      },
    });


      function calculateCumulative(array) {
        let sum = 0;
        return array.map((value) => (sum += value));
      }

      function updateChart() {
        // Convert dict to list
        const bids = Array.from(bidDict.entries())
          .sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]))
          .map((item) => [parseFloat(item[0]), item[1]]);

        const asks = Array.from(askDict.entries())
          .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
          .map((item) => [parseFloat(item[0]), item[1]]);

        // Calculate cumulative sizes
        const bidPrices = bids.map((bid) => bid[0]);
        const bidSizes = calculateCumulative(bids.map((bid) => bid[1]));
        const askPrices = asks.map((ask) => ask[0]).reverse();
        const askSizes = calculateCumulative(
          asks.map((ask) => ask[1])
        ).reverse();

        // Update the chart data
        orderBookChartRef.current.data.labels = [...askPrices, ...bidPrices];
        orderBookChartRef.current.data.datasets[0].data = [
          ...askSizes,
          ...new Array(bids.length).fill(0),
        ];
        orderBookChartRef.current.data.datasets[1].data = [
          ...new Array(asks.length).fill(0),
          ...bidSizes,
        ];

        // Refresh the chart
        orderBookChartRef.current.update();
      }

      function mergeData(wsData) {
        // Iterate through each item in data list
        for (let i = 0; i < wsData["a"].length; i++) {
          const price = wsData["a"][i][0];
          const volume = parseFloat(wsData["a"][i][1]);
          if (askDict.has(price)) {
            if (volume > 0.0) {
              // update volume
              askDict.set(price, volume);
            } else {
              // remove price level
              askDict.delete(price);
            }
          } else if (volume > 0.0) {
            // insert volume
            askDict.set(price, volume);
          }
        }
        for (let i = 0; i < wsData["b"].length; i++) {
          const price = wsData["b"][i][0];
          const volume = parseFloat(wsData["b"][i][1]);
          if (bidDict.has(price)) {
            if (volume > 0.0) {
              // update volume
              bidDict.set(price, volume);
            } else {
              // remove price level
              bidDict.delete(price);
            }
          } else if (volume > 0.0) {
            // insert volume
            bidDict.set(price, volume);
          }
        }
      }

      function initWebsocket() {
        const ws = new WebSocket(config.wsAddress);
        const subscribe = {
          method: "SUBSCRIBE",
          params: [config.symbol + "@depth@" + config.wsSpeed],
          id: 1,
        };
        ws.onopen = function () {
          ws.send(JSON.stringify(subscribe));
        };
        ws.onmessage = function (evt) {
          const response = JSON.parse(evt.data);
          if (response.e === "depthUpdate") {
            wsDataQueue.push(response);
          }
          if (lastUpdateId) {
            while (wsDataQueue.length > 0) {
              const wsData = wsDataQueue.shift();
              if (lastUpdateId < wsData["u"]) {
                mergeData(wsData);
                updateChart();
                // update lastUpdateId
                lastUpdateId = wsData["u"];
              }
            }
          }
        };
        ws.onclose = function () {
          console.log("Websocket connection closed");
        };
      }

      async function initData(updateId) {
        try {
          const response = await fetch(
            config.depthUrl +
              "?symbol=" +
              config.symbol.toUpperCase() +
              "&limit=" +
              config.depthLimit
          );
          const data = await response.json();
          // Update Id
          if (updateId) {
            lastUpdateId = data["lastUpdateId"];
          }
          // Update ask, bid dict
          askDict = new Map(
            data["asks"].map((item) => [item[0], parseFloat(item[1])])
          );
          bidDict = new Map(
            data["bids"].map((item) => [item[0], parseFloat(item[1])])
          );
          // Update chart
          updateChart();
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      }

    // Fetch data for initial render
    initData(false);
    // Subscribe websocket channel
    initWebsocket();
    // Fetch data for websocket update
    setTimeout(function () {
      initData(true);
    }, 2500);
  }, []);

  return (
    <div>
      <h3>Binance Order Book</h3>
      <div className="chart-container">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
};

export default OrderBook;