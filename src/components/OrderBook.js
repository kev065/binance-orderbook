import React, { useState, useEffect } from 'react';
import WebSocket from 'ws';
import { useTable } from 'react-table';
import _ from 'lodash';

const OrderBook = () => {
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });

  useEffect(() => {
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@depth');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const { bids, asks } = data;
      setOrderBook({ bids, asks });
    };

    return () => {
      ws.close();
    };
  }, []);

  const columns = [
    { Header: 'Price', accessor: 'price' },
    { Header: 'Quantity', accessor: 'quantity' },
  ];

  const tableInstance = useTable({
    columns,
    data: orderBook.bids.concat(orderBook.asks),
  });

  const formattedOrderBook = {
    bids: _.orderBy(orderBook.bids, ['price'], ['desc']),
    asks: _.orderBy(orderBook.asks, ['price']),
  };

  return (
    <div>
      <h2>Order Book</h2>
      <div>
        <h3>Bids</h3>
        <table {...tableInstance.getTableProps()}>
          <thead>
            {tableInstance.headerGroups.map((headerGroup) => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column) => (
                  <th {...column.getHeaderProps()}>{column.render('Header')}</th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {formattedOrderBook.bids.map((row, index) => (
              <tr key={index}>
                <td>{row[0]}</td>
                <td>{row[1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <h3>Asks</h3>
        <table {...tableInstance.getTableProps()}>
          <thead>
            {tableInstance.headerGroups.map((headerGroup) => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column) => (
                  <th {...column.getHeaderProps()}>{column.render('Header')}</th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {formattedOrderBook.asks.map((row, index) => (
              <tr key={index}>
                <td>{row[0]}</td>
                <td>{row[1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderBook;
