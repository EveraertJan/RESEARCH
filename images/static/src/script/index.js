
let records = []

function init() {

  const canvas = document.getElementById("heatmap");
  canvas.offscreenCanvas = document.createElement("canvas");

  const h_ctx = canvas.offscreenCanvas.getContext('2d');
  const a_ctx = canvas.getContext('2d');

  canvas.offscreenCanvas.width = document.body.clientWidth;
  canvas.offscreenCanvas.height = document.body.clientHeight;
  
  canvas.width = document.body.clientWidth;
  canvas.height = document.body.clientHeight;


  canvas.colorCanvas = document.createElement('canvas');
  canvas.colorCanvas.width = 200;
  canvas.colorCanvas.height = 20;
  const c_ctx = canvas.colorCanvas.getContext('2d');
  const grad = c_ctx.createLinearGradient(0, 10, 200, 10);

  grad.addColorStop(0, "white");
  grad.addColorStop(0.33, "cyan");
  grad.addColorStop(0.66, "magenta");
  grad.addColorStop(1, "yellow");

  c_ctx.fillStyle = grad;
  c_ctx.fillRect(0, 0, 200, 20);


  getData();

  localStorage.setItem("uid", uuidv4());

  const els = document.querySelectorAll('[drag_active]')


  els.forEach((el, i) => {
    const active = document.querySelectorAll('[dragged=true]')
    el.setAttribute("dragged", false);
    el.setAttribute("hitX", 0);
    el.setAttribute("hitY", 0);
  
    h_ctx.filter = "blur(10px);"



    const handleMouseDown = (e) => {

      el.setAttribute("dragged", true);

      if(parseInt(el.getAttribute("hitY")) == 0) {
        const bb = e.target.getBoundingClientRect();
        el.setAttribute("hitX", bb.x - e.clientX);
        el.setAttribute("hitY", bb.y - e.clientY);

      }

      h_ctx.fillStyle = "black";
      records.forEach((rec) => {
        if(rec.EL == el.id) {
          const blurSize = 400;
          
          let x = ((rec.X / rec.SW) *  canvas.width) + (el.getBoundingClientRect().width / 2);
          let y = ((rec.Y / rec.SH) * canvas.height)+ (el.getBoundingClientRect().height / 2);

          const gradient = h_ctx.createRadialGradient(x, y, 10, x, y, blurSize-10);
          gradient.addColorStop(0, "rgba(0, 0, 0, 0.1)");
          gradient.addColorStop(0.9, "rgba(0, 0, 0, 0)");

          h_ctx.fillStyle = gradient;
          h_ctx.beginPath();
          h_ctx.arc(x, y, blurSize, 0, 2 * Math.PI);
          h_ctx.fill();
        }
      })

      const pixelSize = 28;
      let max = 0;
      for(let i = 0; i <= canvas.width; i+=pixelSize) {
        for(let j = 0; j <= canvas.height; j+=pixelSize) {
          const img = h_ctx.getImageData(Math.floor(i+(pixelSize/2)), Math.floor(j+(pixelSize/2)), 1, 1).data;
          const totalColor = img[0] + img[1] + img[2] + img[3];
          if(totalColor > max) {
            max = totalColor;
          }
        }
      }
      for(let i = 0; i <= canvas.width; i+=pixelSize) {
        for(let j = 0; j <= canvas.height; j+=pixelSize) {
          const img = h_ctx.getImageData(Math.floor(i+(pixelSize/2)), Math.floor(j+(pixelSize/2)), 1, 1).data;
          const totalColor = img[0] + img[1] + img[2] + img[3];
          const mapped = Math.floor( (totalColor / max) * 200);

          const grad_img = c_ctx.getImageData(mapped, 10, 1, 1).data;
          const rgbColor = `rgb(${grad_img[0]} ${grad_img[1]} ${grad_img[2]} / ${grad_img[3] / 255})`;
          console.log(rgbColor)
          a_ctx.fillStyle = rgbColor;
          a_ctx.fillRect(i, j, pixelSize, pixelSize);
        }
      }

    }
    el.addEventListener("pointerdown", (e) => {
      handleMouseDown(e)
    })
  })




  document.addEventListener("pointerup", (e) => {
    
    const active = document.querySelectorAll('[dragged=true]')
    active.forEach((el) =>{
      el.setAttribute("dragged", false);
    })

    h_ctx.clearRect(0, 0, canvas.width, canvas.height)
    a_ctx.clearRect(0, 0, canvas.width, canvas.height)

  })
  document.addEventListener("pointermove", (e) => {
    const active = document.querySelectorAll('[dragged=true]')
    active.forEach((el) => {
      let y = (parseInt(el.getAttribute("hitY")) + e.clientY);
      let x = (parseInt(el.getAttribute("hitX")) + e.clientX);
      if(x < 10) { x = 10; }
      if(y < 10) { y = 10; }
      if(x > document.body.clientWidth - 10 - el.getBoundingClientRect().width ) { x = document.body.clientWidth - 10 - el.getBoundingClientRect().width; }
      if(y > document.body.clientHeight - 10 - el.getBoundingClientRect().height ) { y = document.body.clientHeight - 10 - el.getBoundingClientRect().height; }
      el.style.top = y + "px";
      el.style.left = x + "px";
      el.style.position = "absolute"
    })
  })


  document.getElementById("save_btn").addEventListener("click", (e) => {
    save();
  })
}

function getData() {

 fetch("https://janeveraert.be/api.php")
    .then(r => r.json())
    .then((r) => {
      records = r.data;
      last();
    });

}
function last() {


  const elements = {}
  const els = document.querySelectorAll('[drag_active]')
  els.forEach((el, i) => {
    elements[el.id] = { x: [], y: []};
  });
  for(let i = 0; i < records.length; i++) {
    const e = records[i];
    if(!elements[e.EL]) {
    } else {
      elements[e.EL].x.push(e.X / e.SW);
      elements[e.EL].y.push(e.Y / e.SH);
    }
  }

  els.forEach((ef) => {
    const e = elements[ef.id];
    ef.setAttribute("dragged", false);
    ef.style.position = "absolute";
    let x = ((e.x[0]) * document.body.clientWidth);
    let y = ((e.y[0]) * document.body.clientHeight);
    if(x < 10) { x = 10; }
    if(y < 10) { y = 10; }
    if(x > document.body.clientWidth - 10 - ef.getBoundingClientRect().width ) { x = document.body.clientWidth - 10 - ef.getBoundingClientRect().width; }
    if(y > document.body.clientHeight - 10 - ef.getBoundingClientRect().height ) { y = document.body.clientHeight - 10 - ef.getBoundingClientRect().height; }
    ef.style.left = x + "px";
    ef.style.top = y + "px";
  })
}

function save() {
  console.log("storing the information");
  var sh = document.body.clientHeight;
  var sw = document.body.clientWidth;
  const els = document.querySelectorAll('[drag_active]')
  els.forEach((el, i) => {
    const r = el.getBoundingClientRect();
    const id = el.id;
    const uid = localStorage.getItem('uid')

    const body = {
      sw, sh, uid, x: r.x, y: r.y, el: id
    }

    fetch("https://janeveraert.be/api.php", {
      method: "POST",
      body: JSON.stringify(body)
    })
      .then(r=>r.json())
      .then(r=>{
        document.getElementById("save_btn").innerText = "saved"
      })
  })
}



function average(values) {
  let c = values.reduce(
    (accumulator, currentValue) => accumulator + currentValue,
    0,
  );
  return c / values.length
}

function median(values) {

  if (values.length === 0) {
    throw new Error('Input array is empty');
  }

  values = [...values].sort((a, b) => a - b);

  const half = Math.floor(values.length / 2);

  return (values.length % 2
    ? values[half]
    : (values[half - 1] + values[half]) / 2
  );

}

function uuidv4() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
    (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
  );
}

if(document.body.clientWidth > 800) {
  init();
}