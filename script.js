
let resolutionUniformLocation;
let scaleUniformLocation;
let centerUniformLocation;
let shaderProgram;
let gl;
let scale = 3;
let width;
let height;
let center = {x:0,y:0}
const vertexShaderSource = `
    attribute vec4 aVertexPosition;

    
    void main() {
        gl_Position = aVertexPosition;
        
    }
`;
const fragmentShaderSource = `
    
    precision highp float;
    uniform vec2 resolution;
    uniform float scale;
    uniform vec2 center;
    float cell(vec2 cc){
        
        if( (cc.x < 0.6 && cc.x > 0.4 && cc.y < 0.75 && cc.y > 0.25) || length(cc - vec2(0.5,0.75)) < 0.1 || length(cc - vec2(0.4,0.25)) < 0.1 || length(cc - vec2(0.6,0.25)) < 0.1  ){//|| cc.x < 0.02 || cc.y < 0.02 || cc.x > 0.98 || cc.y > 0.98 || (cc.x < 0.51 && cc.x > 0.49) || (cc.y < 0.51 && cc.y > 0.49)
            return 1.0;
        }else{
            return 0.0;
        }
    }
    
    float grid(vec2 coord) {
        vec2 cc = fract(coord-0.5);
        
        vec2 ccg = coord+25.5 - fract(coord+25.5);
        vec2 cc51 = fract(ccg/51.0);
        
        coord /= 51.0;
        
        vec2 ccg51 = coord+25.5 - fract(coord+25.5);
        vec2 cc2601 = fract(ccg51/51.0);
        
        return cell(cc)*cell(cc51)*cell(cc2601)*(0.65 +0.45*(scale - 1.5)/74.5);//;
        
    }
    
    
    void main() {
        
        vec2 nc = (gl_FragCoord.xy - resolution / 2.0)/resolution.x*2.0*scale+center;
        if(grid(nc)> 0.1){
            gl_FragColor = vec4(grid(nc)*vec3(0.0,1.0,0.0),1.0);
        }else{
            gl_FragColor = vec4(10.0/255.0,20.0/255.0,30.0/255.0,1.0);
        }
        
        
    }
`;



function setup(canvas){
    
    

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error('An error occurred compiling the shaders:', gl.getShaderInfoLog(vertexShader));
        gl.deleteShader(vertexShader);
        return null;
    }
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error('An error occurred compiling the shaders:', gl.getShaderInfoLog(fragmentShader));
        gl.deleteShader(fragmentShader);
        return null;
    }
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error('Unable to initialize the shader program:', gl.getProgramInfoLog(shaderProgram));
        return null;
    }
    gl.useProgram(shaderProgram);
    const vertices = new Float32Array([
        -1, 1,
         -1, -3,
         3,1
    ]);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
    resolutionUniformLocation = gl.getUniformLocation(shaderProgram, "resolution");
    scaleUniformLocation = gl.getUniformLocation(shaderProgram, "scale");
    centerUniformLocation = gl.getUniformLocation(shaderProgram, "center");
    
    const vertexPosition = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
    
    gl.vertexAttribPointer(vertexPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexPosition);
}
function setResolution(x,y){
    gl.uniform2f(resolutionUniformLocation,x,y);
}
function setScale(value){
    gl.uniform1f(scaleUniformLocation,value);
}
function setCenter(){
    let x = center.x;
    let y = center.y;
    
    console.log(center);
    gl.uniform2f(centerUniformLocation,x,y);
}
let stack = []

function zoom(x,y,dn){
    
    if(scale < 1.5){
        scale *= 51;
        center.x*=51;
        center.y*=51;
        stack.push(Math.floor(center.x / 2601),Math.floor(center.y / 2601));
        center.x = center.x%2601;
        center.y = center.y%2601;
        console.log(Math.floor(center.x / 2601),Math.floor(center.y / 2601));
        
        
    }
    if(scale > 51*1.5){
        scale /= 51;
        if(stack.length!== 0){
            let py = stack.pop();
            let px = stack.pop();
            
            console.log(px,py,stack);
            center.x += px * 2601;
            center.y += py * 2601;
            
        }
        center.x/= 51;
        center.y/= 51;
        
    }
    let ds = dn * scale;
    
    center.x -= (x+0.5 - width / 2) / width * 2 * ds;
    center.y -= (height - y - 1+0.5 - height / 2) / width * 2 * ds;
    scale += ds;
    setCenter();
    
    
    
    console.log(scale,center);
    
    
}
function wheel(ev){
    zoom(ev.x,ev.y,ev.deltaY * 0.001)
}
let pointerPos = {x:0,y:0};
let pressed = false;
function setPointer(x,y){
    pointerPos.x = x;
    pointerPos.y = y;
}
function movePointer(x,y){
    center.x-=(x - pointerPos.x) / width * 2 * scale;
    center.y+=(y - pointerPos.y) / width * 2 * scale;
    
    setCenter();
    
    pointerPos.x = x;
    pointerPos.y = y;
}

function mouseDown(ev){
    pressed = true;
    setPointer(ev.x,ev.y);
    //console.log(ev.x);
    
}
function mouseUp(ev){
    pressed = false;
    //console.log(ev.x);
   
}
function mouseMove(ev){
    if(pressed){
        movePointer(ev.x,ev.y);
        //console.log((ev.x - mousePos.x),mousePos);
    }
    
    
}

let touched = false;
let touchPos = {x:0,y:0};
let touhes = 0;
let touchDist;
function touchStart(ev){
    
    touhes = 0;
    touched = true;
}
function touchMove(ev){
    if(touched){
        if(ev.touches.length === 1){
            if(ev.touches.length!== touhes){
                setPointer(ev.touches[0].clientX,ev.touches[0].clientY);
            }
            movePointer(ev.touches[0].clientX,ev.touches[0].clientY);
        }else if(ev.touches.length === 2){
            
            let x,y,dx,dy;
            x = (ev.touches[0].clientX + ev.touches[1].clientX)/2;
            y = (ev.touches[0].clientY + ev.touches[1].clientY)/2;
            dx = (ev.touches[0].clientX - ev.touches[1].clientX);
            dy = (ev.touches[0].clientY - ev.touches[1].clientY);
            let newDist = Math.sqrt(dx*dx+dy*dy);
            
            
            if(ev.touches.length!== touhes){
                setPointer(x,y);
                touchDist = newDist;
            }
            movePointer(x,y);
            zoom(x,y,1 - newDist / touchDist);
            touchDist = newDist;
        }
        touhes = ev.touches.length;
    }
}
function touchEnd(ev){
    if(ev.touches.length === 0){
        touhes = 0;
        touched = false;
    }
    
}
function main(){
    const canvas = document.getElementById("myCanvas");
    gl = canvas.getContext("webgl");
    if (!gl) {
        console.error('Unable to initialize WebGL. Your browser may not support it.');
        return;
    }
    setup(gl,canvas);
    canvas.addEventListener("wheel", wheel, { passive: false });
    canvas.addEventListener("mousedown", mouseDown);
    canvas.addEventListener("mouseup", mouseUp);
    canvas.addEventListener("mousemove", mouseMove);
    canvas.addEventListener("touchstart",touchStart)
    canvas.addEventListener("touchmove",touchMove)
    canvas.addEventListener("touchend",touchEnd)
    
    
    
    function draw() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        width = canvas.width;
        height = canvas.height;
        
        gl.viewport(0, 0, width, height);
        setResolution(width,height);
        setScale(scale);
        
        
        
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
    
}
main()
    