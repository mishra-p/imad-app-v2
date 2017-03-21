console.log('Loaded!');
var img=document.getElementById('hide');
var marginLeft=0;
function moveRight(){
    marginLeft+=5;
    img.style.marginLeft=marginLeft+'px';
}
img.onclick=function (){
  var interval=setInterval(moveRight,50);  
};
