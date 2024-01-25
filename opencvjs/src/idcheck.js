let _video_width = 0;
let _video_height = 0;
let screenshot = false;
const dni_aspect_ratio = 85.6/53.98;
let video = document.getElementById("videoInput");

navigator.mediaDevices.getUserMedia({   
    audio: false,
    video: { 
        facingMode:"environment",
        width: { min: 1280, ideal: 1920, max: 2560 },
        height: { min: 720, ideal: 1080, max: 1440 }, 
    }
})
.then(function (stream) {
    video.srcObject = stream;
    video.play();
})
.catch(function(err) {
    console.log("An error occurred! " + err);
});

video.onplaying = function () {
    _video_width = video.videoWidth;
    _video_height = video.videoHeight;

    console.log("video dimens loaded w="+_video_width+" h="+_video_height);

    var debugdiv = document.getElementById("debugdiv");
    debugdiv.style.top = _video_height + 20 + "px";
    debugdiv.innerHTML = _video_width + " x " + _video_height;

    var canvas_scan = document.getElementById("canvasScan");
    canvas_scan.width = _video_width;
    canvas_scan.height = _video_height;
    let canvas_scan_src = new cv.Mat(canvas_scan.height, canvas_scan.width, cv.CV_8UC4);

    let canvas_detect = document.getElementById("canvasDetect");
    canvas_detect.width = _video_width;
    canvas_detect.height = _video_height;
    
    let canvas_detect_threshold = document.getElementById("canvasDetectThreshold"); 
    canvas_detect_threshold.width = _video_width;
    canvas_detect_threshold.height = _video_height;

    //Selecciona el lado menor
    let orientation = _video_width < _video_height ? "portrait" : "landscape";
    let detect_w = _video_width*0.8;
    let detect_h = detect_w/1.5;
    let tl_corner_x = _video_width*0.1;
    let tl_corner_y = (_video_height-detect_h)/2;
    let tl_corner = new cv.Point(tl_corner_x, tl_corner_y);
    let br_corner = new cv.Point(tl_corner_x+detect_w, tl_corner_y+detect_h);
    cv.rectangle(canvas_scan_src, tl_corner, br_corner, new cv.Scalar(0,255,0,255), 2, cv.LINE_AA, 0);

    cv.imshow("canvasScan", canvas_scan_src);

    video.height = _video_height;
    video.width = _video_width;
    let cap = new cv.VideoCapture(video);
    let src = new cv.Mat(_video_height, _video_width, cv.CV_8UC4);
    let dst = new cv.Mat(_video_height, _video_width, cv.CV_8UC1);
    
    const FPS = 30;
    function processVideo() {
        let canvas_detect_src = new cv.Mat.zeros(canvas_detect.height, canvas_detect.width, cv.CV_8UC4);
        let src_clone = src.clone();
        let src_user = src.clone();
        let begin = Date.now();
        // Lee imagen del video capturado "cap" y la copia en "src"
        cap.read(src);
        
        let ksize = new cv.Size(3, 3);
        cv.GaussianBlur(src_clone, src_clone, ksize, 0, 0, cv.BORDER_DEFAULT);
        //let dst_gray = new cv.Mat(height, width, cv.CV_8UC4);
        let dst_gray = new cv.Mat(_video_height, _video_width, cv.CV_8UC4);
        cv.cvtColor(src_clone, dst_gray, cv.COLOR_BGR2GRAY, 0);

        //let dst_thresh = new cv.Mat(height, width, cv.CV_8UC4);
        let dst_thresh = new cv.Mat(_video_height, _video_width, cv.CV_8UC4);

        /* Use cv.ADAPTIVE_THRESH_GAUSSIAN_C or cv.ADAPTIVE_THRESH_MEAN_C */
        //cv.adaptiveThreshold(dst_gray, dst_thresh, 255, cv.ADAPTIVE_THRESH_MEAN_C, cv.THRESH_BINARY_INV, 7, 2);
        
        /* Color range filter */
        /*
        cv.inRange(dst_gray, 
            new cv.Mat(dst_gray.rows, dst_gray.cols, dst_gray.type(), [100, 100, 100, 0]), 
            new cv.Mat(dst_gray.rows, dst_gray.cols, dst_gray.type(), [255, 250, 250, 255]),  
            dst_thresh);
        cv.imshow("canvasFilter", dst_thresh);
        */

        cv.threshold(dst_gray, dst_thresh, 100, 255, cv.THRESH_BINARY);
        //cv.imshow("canvasThreshold", dst_thresh);

        /* Dilate */
        //let M = cv.Mat.ones(5, 5, cv.CV_8U);
        //let anchor = new cv.Point(-1, -1);
        //cv.dilate(dst_thresh, dst_thresh, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());

        /* Contours */
        let dst_cont = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
        let contours = new cv.MatVector();
        let hierarchy = new cv.Mat();
        cv.findContours(dst_thresh, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
        let color = new cv.Scalar(255,0,0);
        let max_per = 0;
        let max_per_i = 0;
        let max_area = 0;
        let max_area_i = 0;
        if (contours.size() > 0){
            for (let i = 0; i < contours.size(); ++i) {
                area = cv.contourArea(contours.get(i), false);
                //cv.drawContours(dst_cont, contours, i, color, 1, cv.LINE_8, hierarchy, 100);
                // Get the maximum area contour 
                if (area > max_area){
                    max_area = area;
                    max_area_i = i;
                }
            }

            /*
            let max_area_contour = contours.get(max_area_i);
            let max_area_bb = cv.boundingRect(max_area_contour);
            let max_area_bb_p1 = new cv.Point(max_area_bb.x, max_area_bb.y);
            let max_area_bb_p2 = new cv.Point(max_area_bb.x + max_area_bb.width, max_area_bb.y + max_area_bb.height);
            cv.rectangle(canvas_detect_src, max_area_bb_p1, max_area_bb_p2, new cv.Scalar(0,0,255,255), 2, cv.LINE_AA, 0);
            cv.rectangle(canvas_detect_src, max_area_bb_p1, max_area_bb_p2, new cv.Scalar(106,132,189,100), -1, cv.LINE_AA, 0);
            cv.circle(canvas_detect_src, area_center, 20, new cv.Scalar(255,0,0,255), -1);
            */
            /*
            if(!screenshot){
                // Calcula que la posicion y dimensiones de la zona detectada esta dentro de la zona de enfoque
                if (max_area_bb.x >= tl_corner_x && max_area_bb.y >= tl_corner_y){
                    if(detect_w*0.95 <= max_area_bb.width && max_area_bb.width <= detect_w){
                        if(detect_h*0.85 <= max_area_bb.height && max_area_bb.height <= detect_h){
                            screenshot = true;
                            //if(detect_h*0.95 <= max_area_bb.height && max_area_bb.height <= detect_h){
                                //takePicture(tl_corner_x, tl_corner_y, detect_w, detect_h);
                            //}
                            var modal = document.getElementById("myModal");
                            var modalCanvas = document.getElementById("canvasCropped");
                            modalCanvas.width = _video_width;
                            modalCanvas.height = _video_height;
                            modal.style.display = "block";
                            
                            let rectangle = new cv.Rect(tl_corner_x, tl_corner_y, detect_w, detect_h);
                            let cropped_image = src.roi(rectangle);

                            // Process cropped image
                            let tl_x = 10000; let bl_x = 10000; let tr_x = 0; let br_x = 0; 
                            for (let i = 0; i < max_area_contour.rows; i++) {
                                let startPoint = new cv.Point(max_area_contour.data32S[i * 4], max_area_contour.data32S[i * 4 + 1]);
                                let endPoint = new cv.Point(max_area_contour.data32S[i * 4 + 2], max_area_contour.data32S[i * 4 + 3]);
                                if(startPoint.y <= max_area_bb.y + detect_h*0.15){
                                    if(startPoint.x < tl_x && startPoint.x > 0){
                                        tl_x = startPoint.x;
                                        console.log("tl_x",tl_x);
                                    }
                                    if(startPoint.x > tr_x){
                                        tr_x = startPoint.x;
                                    }
                                }
                                // Bottom
                                if(startPoint.y >= max_area_bb.height - 5){
                                    if(startPoint.x < bl_x && startPoint.x > 0){
                                        bl_x = startPoint.x;
                                    }
                                    if(startPoint.x > br_x){
                                        br_x = startPoint.x;
                                    }
                                }
                            }
                            cv.circle(src, new cv.Point(tl_x,max_area_bb.y), 10, new cv.Scalar(255,0,0,255), -1);
                            cv.circle(src, new cv.Point(tr_x,max_area_bb.y), 10, new cv.Scalar(0,255,0,255), -1);
                            cv.circle(src, new cv.Point(bl_x,max_area_bb.y+max_area_bb.height), 10, new cv.Scalar(0,0,255,255), -1);
                            cv.circle(src, new cv.Point(br_x,max_area_bb.y+max_area_bb.height), 10, new cv.Scalar(0,255,255,255), -1);
                            /*
                            let dst_persp = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
                            let dsize = new cv.Size(src.cols, src.rows);
                            //let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [173,45, 970,40, 80,501, 1150,490]); //tl, tr, bl, br
                            let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [tl_x,max_area_bb.y, tr_x,rect_area.y, bl_x,rect_area.y+rect_area.height, br_x,rect_area.y+rect_area.height]);
                            let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, src_w, 0, 0, src_h, src_w, src_h]);
                            console.log(src.cols, src.rows);
                            let M = cv.getPerspectiveTransform(srcTri, dstTri);
                            cv.warpPerspective(src, dst_persp, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
                            *//*
                            cv.imshow("canvasCropped", src);
                            //cv.imshow("canvasCropped", cropped_image);
                            
                            var close = document.getElementsByClassName("close")[0];
                            close.onclick = function() {
                                modal.style.display = "none";
                                screenshot = false;
                            }
                        }
                    }
                }
            }
            */


            let max_area_contour = contours.get(max_area_i);
            let max_area_rotrect = cv.minAreaRect(max_area_contour);
            let vertices = cv.RotatedRect.points(max_area_rotrect);
            const max_area_center = max_area_rotrect.center;
            for (let i = 0; i < 4; i++) {
                cv.line(canvas_detect_src, vertices[i], vertices[(i + 1) % 4], new cv.Scalar(255,0,0,255), 2, cv.LINE_AA, 0);
            }
            //cv.circle(canvas_detect_src, max_area_center, 20, new cv.Scalar(255,0,0,255), -1);

            let max_area_boundrect = cv.boundingRect(max_area_contour);
            let max_area_br_p1 = new cv.Point(max_area_boundrect.x, max_area_boundrect.y);
            let max_area_br_p2 = new cv.Point(max_area_boundrect.x + max_area_boundrect.width, max_area_boundrect.y + max_area_boundrect.height);
            cv.rectangle(canvas_detect_src, max_area_br_p1, max_area_br_p2, new cv.Scalar(0,0,255,255), 2, cv.LINE_AA, 0);

            if(!screenshot){
                if(max_area_rotrect.size.width >= max_area_boundrect.width*0.95) {
                    if(max_area_rotrect.size.height >= max_area_boundrect.height*0.95) {
                        if(detect_h*0.85 <= max_area_boundrect.height && max_area_boundrect.height <= detect_h){
                            if(max_area_boundrect.x >= tl_corner_x && max_area_boundrect.y >= tl_corner_y){
                                console.log("max_area_rotrect.size.width:", max_area_rotrect.size.width, "max_area_boundrect.width:", max_area_boundrect.width);
                                console.log("TAKE PICTURE!!");
                                screenshot = true;

                                let topLeftCorner;
                                let topLeftCornerDist = 0;

                                let topRightCorner;
                                let topRightCornerDist = 0;

                                let bottomLeftCorner;
                                let bottomLeftCornerDist = 0;

                                let bottomRightCorner;
                                let bottomRightCornerDist = 0;

                                for (let i = 0; i < max_area_contour.data32S.length; i+=2) {
                                    const point = { x: max_area_contour.data32S[i], y: max_area_contour.data32S[i + 1] };
                                    const dist = Math.sqrt(Math.pow((point.x - max_area_center.x), 2) + Math.pow((point.y - max_area_center.y), 2));
                                    if (point.x < max_area_center.x && point.y < max_area_center.y) {
                                        // top left
                                        if (dist > topLeftCornerDist) {
                                            topLeftCorner = point;
                                            topLeftCornerDist = dist;
                                        }
                                    } else if (point.x > max_area_center.x && point.y < max_area_center.y) {
                                        // top right
                                        if (dist > topRightCornerDist) {
                                            topRightCorner = point;
                                            topRightCornerDist = dist;
                                        }
                                    } else if (point.x < max_area_center.x && point.y > max_area_center.y) {
                                        // bottom left
                                        if (dist > bottomLeftCornerDist) {
                                            bottomLeftCorner = point;
                                            bottomLeftCornerDist = dist;
                                        }
                                    } else if (point.x > max_area_center.x && point.y > max_area_center.y) {
                                        // bottom right
                                        if (dist > bottomRightCornerDist) {
                                            bottomRightCorner = point;
                                            bottomRightCornerDist = dist;
                                        }
                                    }
                                }
                                
                                /*
                                cv.circle(src, topLeftCorner, 10, new cv.Scalar(255,0,0,255), -1);
                                cv.circle(src, topRightCorner, 10, new cv.Scalar(0,255,0,255), -1);
                                cv.circle(src, bottomLeftCorner, 10, new cv.Scalar(0,0,255,255), -1);
                                cv.circle(src, bottomRightCorner, 10, new cv.Scalar(0,255,255,255), -1);
                                
                                console.log("tl - R", topLeftCorner, "tl dist", topLeftCornerDist);
                                console.log("tr - G", topRightCorner, "tr dist", topRightCornerDist);
                                console.log("bl - B", bottomLeftCorner, "bl dist", bottomLeftCornerDist);
                                console.log("br - GB", bottomRightCorner, "br dist", bottomRightCornerDist);
                                cv.drawContours(src, contours, max_area_i, new cv.Scalar(255,0,0,255), 5, cv.LINE_8, hierarchy, 0);
                                */

                                var modal = document.getElementById("myModal");
                                var modalCanvas = document.getElementById("canvasCropped");
                                modalCanvas.width = _video_width;
                                //modalCanvas.height = _video_height;
                                modalCanvas.height = _video_width/dni_aspect_ratio;
                                console.log("modalCanvas width-height", modalCanvas.width, modalCanvas.height);
                                modal.style.display = "block";

                                //let dst_persp = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
                                let dst_persp = new cv.Mat(modalCanvas.height, modalCanvas.width, cv.CV_8UC3);
                                let dsize = new cv.Size(src.cols, src.rows);
                                //let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [173,45, 970,40, 80,501, 1150,490]); //tl, tr, bl, br
                                let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [topLeftCorner.x,topLeftCorner.y, topRightCorner.x,topRightCorner.y, bottomLeftCorner.x,bottomLeftCorner.y, bottomRightCorner.x,bottomRightCorner.y]);
                                let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, src.cols, 0, 0, src.rows, src.cols, src.rows]);
                                console.log("src.cols, src.rows", src.cols, src.rows);
                                console.log("_video_width, _video_height", _video_width, _video_height);
                                let M = cv.getPerspectiveTransform(srcTri, dstTri);
                                cv.warpPerspective(src, dst_persp, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

                                cv.imshow("canvasCropped", dst_persp);
                                //cv.imshow("canvasCropped", cropped_image);
                                
                                var close = document.getElementsByClassName("close")[0];
                                close.onclick = function() {
                                    modal.style.display = "none";
                                    screenshot = false;
                                }
                            }
                        }
                    }
                }
            }
        }
        
        cv.imshow("canvasDetect", canvas_detect_src);
        //cv.imshow("canvasDetectThreshold", canvas_detect_src);
        
        src_clone.delete(); 
        canvas_detect_src.delete(); 
        src_user.delete();
        dst_gray.delete(); 
        dst_thresh.delete(); 
        dst_cont.delete();
        contours.delete(); 
        hierarchy.delete();

        let delay = 1000/FPS - (Date.now() - begin);
        setTimeout(processVideo, delay);
    }
    setTimeout(processVideo, 0);
}

function takePicture(corner_x, corner_y, w, h){
    var modal = document.getElementById("myModal");
    var modalCanvas = document.getElementById("canvasCropped");
    modal.style.display = "block";

    //let src_to_crop = cv.imread('canvasDetect');
    /*
    let rectangle = new cv.Rect(150, 50, 560, 380); //rect = new cv.Rect(x, y, width, height);
    let cropped_image = src_to_crop.roi(rectangle);
    cv.imshow("canvasCropped", cropped_image);
    */
    //modalCanvas.getContext("2d").drawImage(video, 0, 0, 300, 300, 0, 0, 300, 300);
    modalCanvas.getContext("2d").drawImage(video, corner_x, corner_y, w, h);
    var close = document.getElementsByClassName("close")[0];

    close.onclick = function() { 
        modal.style.display = "none";
    }
}