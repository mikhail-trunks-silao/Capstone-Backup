const express = require('express');
const app = express();
const con = require('./Public/server.js');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const crypto = require('crypto');
const { stringify } = require('querystring');

app.use(bodyParser.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

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
    res.sendFile("./public/index.html", 'string/html');
});


//APIs
app.get("/api/routes",(req,res)=>{
    const sql = "SELECT * FROM routes";

    con.query(sql, (err, results) => {
        if (err) throw err;
        res.json(results);
      });
})


app.get('/api/route/:route_id', (req, res) => {
    const route_id = req.params.route_id;
    const sql = 'SELECT * FROM waypoints INNER JOIN routes ON routes.route_id = waypoints.route_id WHERE routes.route_id = ?';
    con.query(sql, [route_id], (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
      
      // Convert the waypoints string to an array
      const parsedResults = results.map(result => {
        if (result.waypoints) {
          result.waypoints = JSON.parse(result.waypoints);
        }
        return result;
      });
  
      res.json(parsedResults);
    });
  });
  
  app.post('/api/insert-route', async (req, res) => {
    // Get the data from the request body
    const username = req.body.username;
    const routeNumber = req.body.routeNumber;
    const routeName = req.body.routeName;
    const routeColor = req.body.routeColor;
    const waypoints = JSON.stringify(req.body.routeWaypoints);

  
    const query = 'INSERT INTO routes (route_number, route_name, username, route_color, fare_id) VALUES (?, ?, ?, ?, ?)';
    const values = [routeNumber, routeName, username, routeColor, 1];
  
    con.query(query, values, (err, result) => {
      if (err) {
        console.error('Error inserting data:', err);
        res.status(500).json({ message: 'Error inserting data into routes' });
        return;
      }
      const route_id = result.insertId;
      const query2 = 'INSERT INTO waypoints (route_id, waypoints) VALUES (?, ?)';
      const values2 = [route_id, waypoints];
  
      con.query(query2, values2, (err, result) => {
        if (err) {
          console.error('Error inserting data:', err);
          res.status(500).json({ message: 'Error inserting data into waypoints' });
          return;
        }
        console.log('Data inserted successfully');
        res.status(201).json({ message: 'Data inserted successfully', route_id: route_id });
      });
    });
  });

  //Update route
  app.put('/api/update-route', async (req, res) => {
    // Get the data from the request body
    console.log(req.body)
    const username = req.body.username;
    const routeNumber = req.body.routeNumber;
    const routeName = req.body.routeName;
    const routeColor = req.body.routeColor;
    const routeId = req.body.routeId;
    const waypoints = JSON.stringify(req.body.routeWaypoints);

  
    const query = 'UPDATE routes SET route_number = ?, route_name = ?, username = ?, route_color = ? WHERE route_id = ?';
    const values = [routeNumber, routeName, username, routeColor, routeId];
  
    con.query(query, values, (err, result) => {
      if (err) {
        console.error('Error inserting data:', err);
        res.status(500).json({ message: 'Error updating data into routes' });
        return;
      }
  
      const query2 = 'UPDATE waypoints SET waypoints = ? WHERE route_id = ?';
      const values2 = [waypoints, routeId];
  
      con.query(query2, values2, (err, result) => {
        if (err) {
          console.error('Error inserting data:', err);
          res.status(500).json({ message: 'Error inserting data into waypoints' });
          return;
        }
        console.log('Data inserted successfully');
        res.status(201).json({ message: 'Data inserted successfully', routeName });
      });
    });
  });
  

  //API to get username
  app.get('/api/username', (req, res) => {
    if (req.session.user) {
      res.status(200).json({ username: req.session.user.username });
    } else {
      res.status(401).json({ message: 'Not logged in' });
    }
  });

//API for fare-matrix
app.get('/api/fare-matrix', async (req, res) => {
  const sql = 'SELECT * FROM fare_matrix WHERE fare_id = 1';
  con.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
      return;
    }
    res.status(200).json(result[0]);
  });
});

app.post('/api/update-fare-matrix', async (req, res) => {
  const { traditional_1st4km, traditional_succeeding, modernized_1st4km, modernized_succeeding } = req.body;

  const sql = 'UPDATE fare_matrix SET traditional_1st4km = ?, traditional_succeeding = ?, modernized_1st4km = ?, modernized_succeeding = ? WHERE fare_id = 1';
  const values = [traditional_1st4km, traditional_succeeding, modernized_1st4km, modernized_succeeding];
 
  con.query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
      return;
    }
    res.status(200).send('Fare matrix updated');
  });
});

//API for get a single route data
app.get('/api/get-route/:routeId', (req, res) => {
  const routeId = req.params.routeId;
  const query = 'SELECT * FROM routes WHERE route_id = ?';

  con.query(query, [routeId], (err, result) => {
    if (err) {
      console.error('Error getting route:', err);
      res.status(500).send('Internal Server Error');
      return;
    }

    console.log(result)
    res.json(result);
  });
});

//API to get a single route waypoints
app.get('/api/get-waypoints/:routeId', (req, res) => {
  const routeId = req.params.routeId;
  const query = 'SELECT * FROM waypoints WHERE route_id = ?';

  con.query(query, [routeId], (err, result) => {
    if (err) {
      console.error('Error getting route:', err);
      res.status(500).send('Internal Server Error');
      return;
    }

    console.log(result)
    res.json(result);
  });
});


app.delete('/api/delete-route/:routeId', (req, res) => {
  const routeId = req.params.routeId;
  const query = 'DELETE FROM routes WHERE route_id = ?';

  con.query(query, [routeId], (err, result) => {
    if (err) {
      console.error('Error deleting route:', err);
      res.status(500).send('Internal Server Error');
      return;
    }

    res.status(200).send('Route deleted successfully');
  });
});
  
//API to get all waypoints
app.get('/api/routing-waypoints', async (req, res) => {
  const sql = 'SELECT * FROM waypoints';
  con.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
      return;
    }
    
    const resultWaypoints = {};

    for (const result of results) {
      resultWaypoints[result.route_id] = JSON.parse(result.waypoints);
    }

    res.json(resultWaypoints);
  });
});


// 

//Webpages
app.get('/login', (req, res) => {
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
        res.status(401).send('Invalid username or password');
        return;
      }
  
      const user = results[0];
      const storedPassword = user.password;
  
      // Compare the stored password with the provided password
      if (password === storedPassword) {
        req.session.user = { username: user.username }; // Save the user object to the session
        res.redirect('/admin');
      } else {
        res.status(401).send('Invalid username or password');
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


app.listen(5000, ()=>{
    console.log('Server is listening on port 5000...')
})