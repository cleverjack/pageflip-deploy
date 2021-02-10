import React, { useEffect, useState, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import HTMLFlipBook from "react-pageflip";
import PdfViewer from './PdfFlip';
import axios from 'axios';

import "./styles.css";
// https://core.ac.uk/download/pdf/22879255.pdf


const App = () => {
  const [pdfs, setPdfs] = useState([]);
  const [pdf, setPdf] = useState(null);

  useEffect(() => {
    axios.get('http://52.53.215.21:3002/get-published-pdfs').then((res) => {
      setPdfs(res.data);
      // if (res.data.length) {
      //   showPdf(res.data[0]);
      // }
    })
  }, []);

  const showPdf = (item) => {
    setPdf(item);
  }

  return (
    <div className="d-flex flex-column align-items-center p-50">
      {
        pdf ? (
          <div>
            <PdfViewer pdf={pdf}></PdfViewer>
          </div>
        ) : (
          <h1>Please Select Book</h1>
        )
      }
      <div className="mt-50 w-100">
        <div>
          <h1>Books</h1>
          <table className="pdf-table w-100">
            <thead>
              <tr>
                <th>Name</th>
                <th>Size</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
            {
              pdfs.map(it => (
                <tr ng-repeat="file in pdfFiles" key={it._id}>
                  <td>{it.name}</td>
                  <td>{it.size}</td>
                  <td>{it.created}</td>
                  <td>
                    <button onClick={() => showPdf(it)}>Show</button>
                  </td>
                </tr>
              ))
            }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
