
 //Submit username/password to login
 var submit=document.getElementById('submit_btn');
 
 submit.onclick = function(){
     //Create a request object
     var request=new XMLHttpRequest();
     
     //Capture the response and store it in a variable
     request.onreadystatechange=function(){
       if(request.readyState===XMLHttpRequest.DONE){
           if(request.status===200){
               alert('Logged in successfully');
           }
           else if(request.status===403){
               alert('Username/password is incorrect');
           }
           else if(request.status===500){
               alert('Something went wrong with the server');
           }
       }  
     };
 };

 //Make the request
 var username=document.getElementById('username').value;
 var password=document.getElementById('password').value;
 request.open('POST','http://mishra-p.imad.hasura-app.io/login',true);
 
 //setting the http header for content type to be json
 request.setRequestHeader('Content-Type','application/json');
 
 //sending the data,name and password-> a json string by converting the object into string 
 request.send(JSON.stringify({username:username, password:password}));
 
 
 
 
 
 
 
 
 