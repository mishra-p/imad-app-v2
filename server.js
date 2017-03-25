var express = require('express');
var morgan = require('morgan');
var path = require('path');
var crypto=require('crypto');//for hashing

var app = express();
app.use(morgan('combined'));
var Pool=require('pg').Pool;
var config={
    host:'db.imad.hasura-app.io',
    user:'mishra-p',
    port:'5432', 
    database:'mishra-p',
    password:process.env.DB_PASSWORD
};

// create the pool somewhere globally so its lifetime
// lasts for as long as your app is running
 var pool = new Pool(config);

function hash(input,salt){
    //here 512 means the hashed password will be a 512 byte string
    //the function takes the value <input> and appends with salt and applies the hash function 10000 times on the new string formed
    //if input is "password" then-> password-this-is-some-random->hash-> again hashed for 10000 times
    //random values of salt is used for making hashed password more secure
    var hashed=crypto.pbkdf2Sync(input,salt,10000,512,'sha512');
    return["pbkdf2Sync","10000",salt,hashed.toString('hex')];//hashed will be in a sequence of bytes so convert to string for readibility
    
}

app.get('/hash/:input',function(req,res){
    var hashedString=hash(req.params.input,'this-is-some-random-string');
    res.send(hashedString);
});

app.get('/test-db',function(req,res){
    //make a select request
    
    //return   a response with the results
    pool.query('SELECT * from test', function(err,result){
        //in case of error
        if(err){
            res.status(500).send(err.toString());
        }
        else{
            res.send(JASON.stringfy(result.rows));
        }
    });
});

var counter=0;
app.get('/counter', function(req,res){
    counter=counter+1;
    res.send(counter.toString());
});

var names=[];   
app.get('/submit-name/:name',function(req,res){
   //Get the name from the request
   var name=req.params.name;
   
   names.push(name);
   //JSON:Javascript Object No tation...to convert object into string 
   res.send(JSON.stringfy(names));
});

//object for html template
function createTemplate(data){
	var title=data.title;
	var date=data.date;
  	var heading=data.heading;
	var content=data.content;

var htmlTemplate= `
<html>
    <head>
     <link href="/ui/style.css" rel="stylesheet" />
     <title>
            ${title}
     </title>
     <meta name="viewport" content="width=device width, initial-scale=1" />
    </head>
    <body>
<div>
           
 <a href="/">Home</a>
       
 </div>
      
  <hr>
       
 <div>
            
<h3>
	${heading}
</h3>
        
</div>
  
<div>
	${date.toDateString()}
</div>
      
<div>
            

        ${content}
</div>
    
</body>

</html>
 
`;
	return htmlTemplate;
}

app.get('/', function (req, res) {
  res.sendFile(path  .join(__dirname, 'ui', 'index.html'));
});
 
app.get('/article/:articleName',function(req,res){
	//articleName==article-one 
	//article[articleName]==content object for article one  
   
   //article data object var articleData
   
   //select a particular article WhERE title='\';DELETE from article where a=\'asdf
   pool.query("SELECT * FROM article WHERE title= $1",[req.params.articleName],function(err,result){
       //once we get the result
       if(err){
           res.status(500).send(err.toString());
       }
       else
       {
           //if no such title existed in db
           if(result.rows.length===0)
           res.status(404).send('Article not found');
            else{ //if article is there
                var articleData=result.rows[0];
                res.send(createTemplate(articleData)); 
            }
           
       }
   });
});

app.get('/ui/main.js',function(req,res){
    res.sendFile(path.join(__dirname,'ui','main.js'));
});
app.get('/ui/style.css', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'style.css'));
});

app.get('/ui/madi.png', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'madi.png'));
});


var port = 8080; // Use 8080 for local development because you might already have apache running on 80
app.listen(8080, function () {
  console.log(`IMAD course app listening on port ${port}!`);
});
