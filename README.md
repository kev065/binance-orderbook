OrderBook.js is a React component that displays a real-time order book for the BTCUSDT trading pair on Binance. It uses the Binance WebSocket API to receive real-time order book updates and displays this data on a bar chart using Chart.js.

## Features
1. **Real-time Data**: The component establishes a WebSocket connection to Binance and subscribes to real-time depth updates for the BTCUSDT trading pair.
2. **Order Book Management**: The component maintains an up-to-date order book by processing each WebSocket message. It updates the volumes of existing price levels, adds new price levels, and removes price levels with a volume of zero.
3. **Chart Display**: The component displays the order book data on a bar chart, with separate bars for bids (buy orders) and asks (sell orders). The chart updates in real-time as new WebSocket messages are received.
4. **Error Handling**: The component handles WebSocket errors and automatically attempts to reconnect if the WebSocket connection is closed.

## Usage
To use this component, clone this repo by running ```git clone git@github.com:kev065/binance-orderbook.git``` on your terminal.


Then install Chart.js by running ```npm install chart.js``` in the cloned directory.
