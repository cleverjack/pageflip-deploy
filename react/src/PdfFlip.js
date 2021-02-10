import React, { useEffect, useState } from 'react';
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import * as pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";
import {PageFlip} from 'page-flip';

const getPdfImages = (url) => {
    let promiseAll = [];

    return new Promise((resolve, reject) => {
        pdfjsLib.getDocument(url).promise.then(loadedPdf => {
            if (loadedPdf && loadedPdf.numPages) {
                for (let i = 0; i < loadedPdf.numPages; i++) {
                    promiseAll.push(loadedPdf.getPage(i + 1));
                }

                Promise.all(promiseAll).then(pages => {
                    let canvases = [];

                    for (let j = 0; j < pages.length; j++) {
                        let page = pages[j];

                        const viewport = page.getViewport({ scale: 1.5 });
                        const canvas = document.createElement('canvas');
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;
                        const renderContext = {
                            canvasContext: canvas.getContext('2d'),
                            viewport: viewport
                        };
                        const div = document.createElement('div');
                        div.className = "page";
                        div.appendChild(canvas);

                        const shadow = document.createElement('div');
                        shadow.className = "shadow";
                        div.appendChild(shadow);

                        canvases.push(div);

                        page.render(renderContext);
                    }
                    resolve({canvases, totalPageNum: loadedPdf.numPages});
                }, function (reason) {
                    reject(reason);
                })
            }
        }, function (reason) {
            console.error(reason);
            reject(reason);
        });
    })
};

let defaultPageAudioObj = new Audio("http://52.53.215.21:3002/audio/flip.mp3");
let pageAudioObj = new Audio();
let bgAudioObj = new Audio();

export default function PdfViewer({ pdf }) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
    const [totalPageNum, setTotalPageNum] = useState(0);
    const [currentPageNum, setCurrentPageNum] = useState(0);
    const [book, setBook] = useState();
    const [isMute, setIsMute] = useState(false);

    useEffect(() => {
        if (pdf && pdf.url) {
            let url = 'http://52.53.215.21:3002/' + pdf.url;
            setTotalPageNum(0);
            setCurrentPageNum(0);

            if (pdf.bgAudio && !isMute) {
                bgAudioObj.src = "http://52.53.215.21:3002/audio/" + pdf.bgAudio.url;
                bgAudioObj.play();
            }
            
            getPdfImages(url).then(data => {
                setTotalPageNum(data.totalPageNum);
                if (book) {
                    book.destroy();
                    
                    const flipPageRoot = document.createElement('div');
                    flipPageRoot.id = "flip-book";

                    let flipPageWrapperElement = document.getElementById("flip-book-wrapper");
                    flipPageWrapperElement.prepend(flipPageRoot);
                }
                let flipBook = new PageFlip(document.getElementById('flip-book'),
                    {
                        width: 300, // required parameter - base page width
                        height: 500,  // required parameter - base page height
                        showCover: true
                    }
                );
    
                if (data.canvases && data.canvases.length) {
                    flipBook.loadFromHTML(data.canvases);
                    flipBook.on('flip', (e) => {
                        setCurrentPageNum(e.data);
                        defaultPageAudioObj.play();

                        let pageAudio = pdf.pageAudios.find(it => it.pageNum == e.data);
                        pageAudioObj.pause();

                        if (pageAudio && !isMute) {
                            pageAudioObj.src="http://52.53.215.21:3002/audio/" + pageAudio.url;
                            pageAudioObj.play();
                        }
                    });
                }
                
                setBook(flipBook);
            });
        }
    }, [pdf]);

    useEffect(() => {
        if (isMute) {
            if (bgAudioObj && bgAudioObj.readyState != 0) {
                bgAudioObj.pause();
            }
            if (pageAudioObj && pageAudioObj.readyState != 0) {
                pageAudioObj.pause();
            }
        } else {
            if (bgAudioObj && bgAudioObj.readyState != 0) {
                bgAudioObj.play();
            }
            if (pageAudioObj && pageAudioObj.readyState != 0) {
                pageAudioObj.play();
            }
        }
    }, [isMute]);

    const onPrev = () => {
        if (book) {
            book.flipPrev('bottom');
        }
    }

    const onNext = () => {
        if (book) {
            book.flipNext('bottom');
        }
    }

    const toggleMute = () => {
        setIsMute(!isMute);
    }

    return (
        <div>
            <div>
                {
                    isMute ? (
                        <button onClick={toggleMute}>Unmute</button>
                    ) : (
                        <button onClick={toggleMute}>Mute</button>
                    )
                }
            </div>
            <div style={{'overflow': 'hidden'}}>
                <div id="flip-book-wrapper" style={{'paddingTop': '50px', 'paddingBottom': '50px'}}>
                    <div id="flip-book">
                    </div>
                </div>
            </div>
            <div className="d-flex align-items-center justify-content-center mt-20">
                <button className="page-btn" onClick={onPrev}>Prev</button>
                <span>{currentPageNum + '/' + totalPageNum}</span>
                <button className="page-btn" onClick={onNext}>Next</button>
            </div>
        </div>
    );
}
