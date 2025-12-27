
if (!document.getElementById("artCanvas")) {
    console.log("No es la página del editor, script detenido");
    // Detener ejecución si no es el editor
    // Puedes usar return si está en función, o envolver todo en:
}

// MEJOR ORGANIZACIÓN: Envuelve tu código en una función init
function initEditor() {
    if (!document.getElementById("artCanvas")) return;
    

    if (!document.getElementById("status")) {
        console.warn("Elemento 'status' no encontrado en esta página");
        // Crear función status alternativa
        window.status = function(msg) { console.log("Status:", msg); };
    }
    const artCanvas=document.getElementById("artCanvas");
    const gridCanvas=document.getElementById("gridCanvas");
    const ctx=artCanvas.getContext("2d");
    const gridCtx=gridCanvas.getContext("2d");
    ctx.imageSmoothingEnabled=false;
    
    let gridSize=32;
    let pixelSize=artCanvas.width/gridSize;
    let currentTool="paint";
    let currentColor=document.getElementById("colorPicker").value;
    let drawing=false;
    let undoStack=[], redoStack=[];
    
    function status(msg){document.getElementById("status").textContent=msg;}
    
    function saveState(){
        undoStack.push(ctx.getImageData(0,0,artCanvas.width,artCanvas.height));
            if (undoStack.length > 50) undoStack.shift(); // Limitar a 50 estados
            redoStack = []; // Limpiar rehacer
    }
    function undo(){
        if(undoStack.length>0){
        redoStack.push(ctx.getImageData(0,0,artCanvas.width,artCanvas.height));
        ctx.putImageData(undoStack.pop(),0,0);
        status("Deshacer realizado");
        }
    }
    function redo(){
        if(redoStack.length>0){
        undoStack.push(ctx.getImageData(0,0,artCanvas.width,artCanvas.height));
        ctx.putImageData(redoStack.pop(),0,0);
        status("Rehacer realizado");
        }
    }
    
    function fillBackground(){
        ctx.fillStyle="#fff";
        ctx.fillRect(0,0,artCanvas.width,artCanvas.height);
    }
    function drawGrid(){
        gridCtx.clearRect(0,0,gridCanvas.width,gridCanvas.height);
        if(!document.getElementById("showGrid").checked) return;
        gridCtx.strokeStyle="#ddd";
        for(let i=0;i<=gridSize;i++){
        gridCtx.beginPath();
        gridCtx.moveTo(i*pixelSize+0.5,0);
        gridCtx.lineTo(i*pixelSize+0.5,gridCanvas.height);
        gridCtx.stroke();
        gridCtx.beginPath();
        gridCtx.moveTo(0,i*pixelSize+0.5);
        gridCtx.lineTo(gridCanvas.width,i*pixelSize+0.5);
        gridCtx.stroke();
        }
    }
    function initCanvas(){fillBackground();drawGrid();}
    initCanvas();
    
    function getCell(evt){
        const rect=artCanvas.getBoundingClientRect();
        const x=(evt.clientX-rect.left)*(artCanvas.width/rect.width);
        const y=(evt.clientY-rect.top)*(artCanvas.height/rect.height);
        return {col:Math.floor(x/pixelSize),row:Math.floor(y/pixelSize)};
    }
    function paintCell(c,r,color){
        ctx.fillStyle=color;
        ctx.fillRect(c*pixelSize,r*pixelSize,pixelSize,pixelSize);
    }
    function eraseCell(c,r){
        ctx.fillStyle="#fff";
        ctx.fillRect(c*pixelSize,r*pixelSize,pixelSize,pixelSize);
    }
    function pickColor(col, row) {
        const cx = Math.floor(col * pixelSize + pixelSize / 2);
        const cy = Math.floor(row * pixelSize + pixelSize / 2);
        const d = ctx.getImageData(cx, cy, 1, 1).data;
        const hex = "#" + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2,"0")).join("");
        document.getElementById("colorPicker").value=hex;
        currentColor=hex;
        currentTool="paint";
        status("Color tomado: "+hex);
    }
    
    
    function handleAction(evt){
        const {col,row}=getCell(evt);
        if(col<0||row<0||col>=gridSize||row>=gridSize) return;
        saveState();
        if(currentTool==="paint") paintCell(col,row,currentColor);
        else if(currentTool==="erase") eraseCell(col,row);
        else if(currentTool==="eyedrop") pickColor(col,row);
    }
    function resizeCanvas() {
        const wrap = document.querySelector(".canvas-wrap");
        const size = wrap.clientWidth; // ancho real del contenedor
        artCanvas.width = size;
        artCanvas.height = size;
        gridCanvas.width = size;
        gridCanvas.height = size;
        pixelSize = artCanvas.width / gridSize;
        ctx.imageSmoothingEnabled = false;
        fillBackground();
        drawGrid();
    }
    
      // Llamar al inicio y cada vez que cambie el tamaño de la ventana
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    
    
    artCanvas.addEventListener("mousedown",e=>{drawing=true;handleAction(e);});
    artCanvas.addEventListener("mousemove",e=>{if(drawing&&currentTool!=="eyedrop")handleAction(e);});
    window.addEventListener("mouseup",()=>drawing=false);
    // Añade después de los event listeners de mouse
    artCanvas.addEventListener("touchstart", e => {
        e.preventDefault();
        drawing = true;
        const touch = e.touches[0];
        handleAction(touch);
    });
    
    artCanvas.addEventListener("touchmove", e => {
        e.preventDefault();
        if (drawing && currentTool !== "eyedrop") {
            const touch = e.touches[0];
            handleAction(touch);
        }
    });
    
    artCanvas.addEventListener("touchend", () => drawing = false);
    // Herramientas
    document.getElementById("paint").onclick=()=>{currentTool="paint";status("Herramienta: pintar");};
    document.getElementById("erase").onclick=()=>{currentTool="erase";status("Herramienta: borrar");};
    document.getElementById("eyedrop").onclick=()=>{currentTool="eyedrop";status("Herramienta: cuentagotas");};
    document.getElementById("colorPicker").oninput=e=>{
    currentColor=e.target.value;currentTool="paint";status("Herramienta: pintar");
    };
    
    // Grid
    document.getElementById("applyGrid").onclick = () => {
        let size = parseInt(document.getElementById("gridSize").value);
        size = Math.max(8, Math.min(64, size)); // Validar rango
        document.getElementById("gridSize").value = size;
        gridSize = size;
        pixelSize = artCanvas.width / gridSize;
        fillBackground();
        drawGrid();
        status("Cuadrícula: " + gridSize + "x" + gridSize);
    };
    document.getElementById("showGrid").onchange=()=>drawGrid();
    
    // Botones
    document.getElementById("clear").onclick=()=>{fillBackground();status("Lienzo limpiado");drawGrid();};
    document.getElementById("export").onclick=()=>{
        const url=artCanvas.toDataURL("image/png");
        const a=document.createElement("a");a.href=url;a.download="pixel-art.png";a.click();
        status("Imagen exportada");
    };
    document.getElementById("undo").onclick=undo;
    document.getElementById("redo").onclick=redo;
    
    
}
document.addEventListener("DOMContentLoaded", initEditor);
