var express = require('express');
var morgan = require('morgan');
var path = require('path');
var Pool=require('pg').Pool;
var crypto=require('crypto');//for hashing
/*telling the express framework to look for the jason in the request body and the req body will be a jason using body parser, an express library*/
var bodyParser=require('body-parser');
/*using express session library for cookies*/
var session=require('express-session');

var config={
    host:'db.imad.hasura-app.io',
    user:'mishra-p',
    port:'5432', 
    database:'mishra-p',
    password:process.env.DB_PASSWORD
};

var app = express();
app.use(morgan('combined'));
/*telling bodyparser that for every incoming request,in case it sees jason content, then load the content in req.body variable*/
app.use(bodyParser.json()); 
//telling express to use the session library
app.use(session({
    //secret is the value used to encrypt the cookies with
    secret:'someRandomSecretValue',
    cookie:{maxAge: 1000*60*60*24*30 }//telling the session library the cookie age
}));

// create the pool somewhere globally so its lifetime
// lasts for as long as your app is running
 var pool = new Pool(config);

function hash(input,salt){
    //here 512 means the hashed password will be a 512 byte string
    //the function takes the value <input> and appends with salt and applies the hash function 10000 times on the new string formed
    //if input is "password" then-> password-this-is-some-random->hash-> again hashed for 10000 times
    //random values of salt is used for making hashed password more secure
    var hashed=crypto.pbkdf2Sync(input,salt,10000,512,'sha512');
    return["pbkdf2Sync","10000",salt,hashed.toString('hex')].join('$');//hashed will be in a sequence of bytes so convert to string for readibility
    
}

app.get('/hash/:input',function(req,res){
    var hashedString=hash(req.params.input,'this-is-some-random-string');
    res.send(hashedString);
});

app.post('/create-user',function(req,res){
    
    //extracting username,password from the request body
    //using JASON request for getting data in req body
    //{"username":"prashant", "password:" "password"}<- a POST request looks like this and it is the JASON object that will convert into right username password
    var username=req.body.username;
    var password=req.body.password;
    
    var salt=crypto.randomBytes(128).toString('hex');
    
    var dbString=hash(password,salt);
    pool.query('INSERT INTO "user" (username,password) VALUES ($1,$2)',[username,dbString],function(err,result){
            if(err){
                res.status(500).send(err.toString());
             }
            else{
                res.send('User successfully created'+username);
            }
    });
});

app.post('/login',function(req,res){
     var username=req.body.username;
     var password=req.body.password;
    
    pool.query('SELECT * FROM "user" WHERE username=$1',[username],function(err,result){
            if(err){
                res.status(500).send(err.toString());
             }
            else{
                if(result.rows.length===0)
                    res.send(403).send('user/password is invalid');
                else{
                    // Match the password
                    var dbString=result.rows[0].password;
                    
                    //split function to split by dollar the password stored in database
                    //dbString.split('$');//the value of this will be same as the value returned by hash funct
                    var salt=dbString.split('$')[2]; //getting the salt value from dbString
                    var hashedPassword=hash(password,salt);//creating a hash based on the original salt and the password submitted
                    if(hashedPassword===dbString){
                         //set the session value before sending the response
                         //Assuming that there is a session object on the request which is been created by session library
                         /*There is a key called auth inside the session object that will map to userId:result.row[0].id object and this object says that there is a userId whose value is equal to the value of the that it  got from the user database*/
                         req.session.auth={userId:result.row[0].id};
                         //The above is setting the cookie with session id that it is randomly generating
                         //internally on the server side it maps the session id to an object
                        //{auth:{userId}}
                         //this object contains the value called auth which further contains another obj, userId object
                         //all this info is maintained in the server side
                         //all that the cookie contain is the session id
                         res.send('credentials are correct');
                    }
                    else
                        res.send(403).send('user/password is invalid');
                }
            }

    });
});

//checking whether session is working or not
app.get('/check-login',function(){
    if(req.session && req.session.auth &&req.session.auth.userId){
        res.send('You are logged in: '+req.session.auth.userId.toString());
    }
    else
    res.send("You are not logged in");
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
