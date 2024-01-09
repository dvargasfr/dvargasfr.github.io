import React, { useEffect, useState } from 'react';
import cv from 'react-native-opencv3';

function TestOpencv(){

    const [cvLoaded, setCvLoaded] = useState(false);
    /*
    useEffect(() => {
        // Función para verificar si 'cv' está definido
        const isCVDefined = () => {
            if (window.cv) {
                setCvLoaded(true);
                console.log("window.cv LOADED!!!", window.cv);
            } else {
                setTimeout(isCVDefined, 100);
            }
        };
        isCVDefined();
    }, []);


    useEffect(() => {
        if (cvLoaded) {
            let src = new window.cv.Mat(600, 600, window.cv.CV_8UC4);
            console.log("LOADED!!!", src);
            //let mat = window.cv.imread("./logo192.png");
            //cv.cvtColor(src, dst, cv.COLOR_BGR2GRAY);
            //window.cv.imshow('canvasOutput', src);
        }
    }, [cvLoaded]);
    */

    return(
        <div>
            Hello from TestOpenCV component 
            <canvas id="canvasOutput" ></canvas>
        </div>
    );
}
export default TestOpencv;