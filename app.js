const express = require('express');
const app = express();
const con = require('./public/server.js');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const crypto = require('crypto');
const https = require('https');
const fs = require('fs');

//Router
const routes = require("./router/routes.js")

app.use(bodyParser.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

const privateKey = fs.readFileSync('server-key.pem', 'utf8');
const certificate = fs.readFileSync('server-cert.pem', 'utf8');

const credentials = { key: privateKey, cert: certificate };

const httpsServer = https.createServer(credentials, app);

app.use(express.static('./public'));

function generateSecretKey() {
    return crypto.randomBytes(32).toString('hex');
}
const secretKey = generateSecretKey();

function isAuthenticated(req, res, next) {
    if (req.session.user) {
      next();
    } else {
      res.redirect('/login');
    }
}

app.use(
    session({
      secret: secretKey,
      resave: false,
      saveUninitialized: true,
    })
);
    

con.connect(function(err) {

    if (err) throw err;
    console.log("Connected!");
});



app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use("/api", routes)

app.get("/api", (req, res) =>{
  console.log("Hello");
  res.send("hello")
})


// 

//Webpages
app.get('/login', (req, res) => {
    req.session.destroy();
    const adminPath = path.join(__dirname, 'public/html', 'login.html');
    res.sendFile(adminPath);
})

app.post('/login', (req, res) => {
    const { username, password } = req.body;
  
    // Query the user from the MySQL database
    const sql = 'SELECT * FROM admin WHERE username = ?';
    con.query(sql, [username], (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
        return;
      }
  
      if (results.length === 0) {
        res.sendFile(path.join(__dirname, 'public/html', 'log-in-wrong-details.html'));
        return;
      }
  
      const user = results[0];
      const storedPassword = user.password;
  
      // Compare the stored password with the provided password
      if (password === storedPassword) {
        req.session.user = { username: user.username }; // Save the user object to the session
        res.redirect('/admin');
      } else {
        res.sendFile(path.join(__dirname, 'public/html', 'log-in-wrong-details.html'));
      }
    });
  });


// Removed isAuthenticated for developing purposes
app.get('/admin',isAuthenticated, (req, res) => {

    const adminPath = path.join(__dirname, 'public/html', 'admin.html');
    res.sendFile(adminPath);
})

// app.get('/admin', (req, res) => {

//     const adminPath = path.join(__dirname, 'public/html', 'admin.html');
//     res.sendFile(adminPath);
// })

app.get('/admin/addroute',isAuthenticated, (req, res) => {

  const adminPath = path.join(__dirname, 'public/html', 'addroute.html');
  res.sendFile(adminPath);
})

app.get('/admin/addwaypoints',isAuthenticated, (req, res) => {

  const adminPath = path.join(__dirname, 'public/html', 'addwaypoints.html');
  res.sendFile(adminPath);
})

app.get('/admin/fare-matrix', isAuthenticated, (req, res) => {

  const adminPath = path.join(__dirname, 'public/html', 'fare-matrix.html');
  res.sendFile(adminPath);
})

app.get('/admin/editroute/:routeId', isAuthenticated, (req, res) => {
  const adminPath = path.join(__dirname, 'public/html', 'editroute.html');
  res.sendFile(adminPath);
});

app.get('/admin/editwaypoints/:routeId', isAuthenticated, (req, res) => {
  const adminPath = path.join(__dirname, 'public/html', 'editwaypoints.html');
  res.sendFile(adminPath);
});

app.get('/routing', (req, res) => {
  const adminPath = path.join(__dirname, 'public/html', 'routing.html');
  res.sendFile(adminPath);
});


// app.listen(5000,  '0.0.0.0',()=>{
//     console.log('Server is listening on port 5000...')
// })


httpsServer.listen(5000,  '0.0.0.0',()=>{
    console.log('Server is listening on port 5000...')
})



// export async function buildAndSaveGraph(routes, transferDistance) {
//   const graph = {};
//   const transferPenalty = 1000; // 5km penalty in meters

//   // ... Rest of your buildGraph code here ...

  

//   try {
//     for (const node in graph) {
//       for (const neighbor in graph[node]) {
//         const travelTime = graph[node][neighbor];
//         const [query, parameters] = buildInsertQuery('graph', { node, neighbor, travelTime });
//         await con.execute(query, parameters);
//       }
//     }
//   } finally {
//     await con.end();
//   }
// }

// function buildInsertQuery(table, data) {
//   const keys = Object.keys(data);
//   const values = Object.values(data);

//   const query = `
//     INSERT INTO graph (${keys.join(', ')})
//     VALUES (${keys.map(() => '?').join(', ')})
//   `;

//   return [query, values];
// }
