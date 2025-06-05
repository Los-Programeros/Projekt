# Node backend (Jan)
V tej dokumentaciji je opisan node backend na katerem teče naš admin panel.
Admin panel je sestavljen po zgledu MVC (model view controller). 

Znotraj se nahajajo direktoriji models, controllers in views.

# Controllers
Znotraj direktorija controllers imamo sledeče datoteke:
## [adminController.js](../RAIN/node-backend/controllers/adminController.js)
- Zbira vse ključne podatke iz baze (uporabniki, znamenitosti, senzorji, aktivnosti)
```javascript
const userModel = require('../models/userModel');
const landmarkModel = require('../models/landmarkModel');
const sensorDataModel = require('../models/sensorDataModel');
const userActivityModel = require('../models/userActivityModel');
```
- Vključuje povezane informacije s pomočjo populate
```javascript
const users = await userModel.find();
const landmarks = await landmarkModel.find();
const sensorData = await sensorDataModel.find().populate('user', 'username');
const userActivities = await userActivityModel.find()
    .populate('user', 'username')
    .populate('visited.landmark', 'name');
console.log(JSON.stringify(userActivities, null, 2));
```
- Prikaže podatke na admin panelu
```javascript
res.render('admin', {
            users,
            landmarks,
            landmarksJSON: JSON.stringify(landmarks),
            sensorData,
            userActivities
});
```

## [faceAuthController.js](../RAIN/node-backend/controllers/faceAuthController.js)
- Ustvari sejo z edinstvenim ID-jem in jo pošlje uporabniku.
```javascript
exports.startSession = (req, res) => {
  const sessionId = generateSessionId();
  res.json({ sessionId });
};
```
- Sprejme sliko obraza in preveri, ali se ujema z uporabnikom. isValid je pa funkcija ki se nahaja v [faceRecognition.js](../RAIN/node-backend/services/faceRecognition.js)
```javascript
const isValid = await verifyFaceModel(sessionId, image);
```
- Če je obraz prepoznan, vrne podatke o uporabniku
```javascript
    res.json({
      success: isValid,
      user: {
        id: 1,
        username: "admin",
        email: "admin@gmail.com",
      },
    });
```
## [landmarkController.js](../RAIN/node-backend/controllers/landmarkController.js)
- Vsebuje funkcijo list, za pridobivanje vseh landmarkov
```javascript
list: function (req, res) {
        LandmarkModel.find(function (err, landmarks) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting landmark.',
                    error: err
                });
            }

            return res.json(landmarks);
        });
    },
```
- Vsebuje funkcijo show, za prikaz vseh landmarkov
```javascript
show: function (req, res) {
        var id = req.params.id;

        LandmarkModel.findOne({_id: id}, function (err, landmark) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting landmark.',
                    error: err
                });
            }

            if (!landmark) {
                return res.status(404).json({
                    message: 'No such landmark'
                });
            }

            return res.json(landmark);
        });
    },
```
- Vsebuje funkcijo create, za kreiranje novega landmarka
```javascript
create: function (req, res) {
        var landmark = new LandmarkModel({
			name : req.body.name,
			coordinates : req.body.coordinates,
			category : req.body.category
        });

        landmark.save(function (err, landmark) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when creating landmark',
                    error: err
                });
            }

            return res.status(201).json(landmark);
        });
    },
```
- Vsebuje funkcijo update, za posodabljanje landmarkov
```javascript
update: function (req, res) {
        var id = req.params.id;

        LandmarkModel.findOne({_id: id}, function (err, landmark) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting landmark',
                    error: err
                });
            }

            if (!landmark) {
                return res.status(404).json({
                    message: 'No such landmark'
                });
            }

            landmark.name = req.body.name ? req.body.name : landmark.name;
			landmark.coordinates = req.body.coordinates ? req.body.coordinates : landmark.coordinates;
			landmark.category = req.body.category ? req.body.category : landmark.category;
			
            landmark.save(function (err, landmark) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error when updating landmark.',
                        error: err
                    });
                }

                return res.json(landmark);
            });
        });
    },
```
- Vsebuje funkcijo remove, za odstranjevanje landmarkov
```javascript
remove: function (req, res) {
        var id = req.params.id;

        LandmarkModel.findByIdAndRemove(id, function (err, landmark) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when deleting the landmark.',
                    error: err
                });
            }

            return res.status(204).json();
        });
    }
```
## [sensorDataController.js](../RAIN/node-backend/controllers/sensorDataController.js)
- Vsebuje funkcijo list, za pridobivanje vseh sensorjev
```javascript
list: function (req, res) {
        SensordataModel.find(function (err, sensorDatas) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting sensorData.',
                    error: err
                });
            }

            return res.json(sensorDatas);
        });
    },
```
- Vsebuje funkcijo show, za prikazovanje podatkov vseh senzorjev
 ```javascript
show: function (req, res) {
        var id = req.params.id;

        SensordataModel.findOne({_id: id}, function (err, sensorData) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting sensorData.',
                    error: err
                });
            }

            if (!sensorData) {
                return res.status(404).json({
                    message: 'No such sensorData'
                });
            }

            return res.json(sensorData);
        });
    },
```
- Vsebuje funkcijo create, za kreiranje novih senzorjev
```javascript
create: function (req, res) {
        var sensorData = new SensordataModel({
			user : req.body.user,
			userActivity : req.body.userActivity,
			date : req.body.date,
			coordinates : req.body.coordinates,
			speed : req.body.speed
        });

        sensorData.save(function (err, sensorData) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when creating sensorData',
                    error: err
                });
            }

            return res.status(201).json(sensorData);
        });
    },
```
- Vsebuje funkcijo update, za posodabljanje sensorjev
```javascript
update: function (req, res) {
        var id = req.params.id;

        SensordataModel.findOne({_id: id}, function (err, sensorData) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting sensorData',
                    error: err
                });
            }

            if (!sensorData) {
                return res.status(404).json({
                    message: 'No such sensorData'
                });
            }

            sensorData.user = req.body.user ? req.body.user : sensorData.user;
			sensorData.userActivity = req.body.userActivity ? req.body.userActivity : sensorData.userActivity;
			sensorData.date = req.body.date ? req.body.date : sensorData.date;
			sensorData.coordinates = req.body.coordinates ? req.body.coordinates : sensorData.coordinates;
			sensorData.speed = req.body.speed ? req.body.speed : sensorData.speed;
			
            sensorData.save(function (err, sensorData) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error when updating sensorData.',
                        error: err
                    });
                }

                return res.json(sensorData);
            });
        });
    },
```
- Vsebuje funkcijo remove, za odstranjevanje sensorjev
```javascript
remove: function (req, res) {
        var id = req.params.id;

        SensordataModel.findByIdAndRemove(id, function (err, sensorData) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when deleting the sensorData.',
                    error: err
                });
            }

            return res.status(204).json();
        });
    }
```
## [userActivityController.js](../RAIN/node-backend/controllers/userActivityController.js)
- Vsebuje enake funkcije kot prejšnji komponenti
## [userController.js](../RAIN/node-backend/controllers/userController.js)
- Vsebuje enake funkcije kot prejšnji komponenti


# Models
Znotraj direktorija models imamo sledeče datoteke:

## [landmarkModel.js](../RAIN/node-backend/models/landmarkModel.js)
- Pridobiva podatke iz baze za landmarke ter jih formatira po imenu, koordinatah in kategoriji.
```javascript
var landmarkSchema = new Schema({
	'name' : String,
	'coordinates' : String,
	'category' : String
});
```
## [sensorDataModel.js](../RAIN/node-backend/models/sensorDataModel.js)
- Pridobi podatke iz senzorjev in njihove podatke formatira po uporabniku, aktivnosti, datumu, koordinatah in hitrosti.
```javascript
var sensorDataSchema = new Schema({
	'user' : {
	 	type: Schema.Types.ObjectId,
	 	ref: 'user'
	},
	'userActivity' : {
	 	type: Schema.Types.ObjectId,
	 	ref: 'userActivity'
	},
	'date' : Date,
	'coordinates' : String,
	'speed' : String
});
```
## [userActivityModel.js](../RAIN/node-backend/models/userActivityModel.js)
- Pridobi podatke uporabnikovih aktivnosti in jih formatira po uporabniku, landmarku, ki ga je obiskal in datumu.
```javascript
const userActivitySchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  visited: [
    {
      landmark: {
        type: Schema.Types.ObjectId,
        ref: "landmark",
        required: true,
      },
      visitedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});
```
## [userModel.js](../RAIN/node-backend/models/userModel.js)
- Pridobi podatke uporabnika, njegovega uporabniškega imena, gesla, epošte in statusa ali je aktiven.
```javascript
var userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  active: { type: Boolean, required: false, default: false}
});
```
- Vsebuje še funkcijo za shranjevanje passworda s hashom
```javascript
userSchema.pre("save", function (next) {
  var user = this;
  bcrypt.hash(user.password, 10, function (err, hash) {
    if (err) {
      return next(err);
    }
    user.password = hash;
    next();
  });
});
```
- Vsebuje še funkcijo za avtentikacijo uporabnika ob prijavi
```javascript
userSchema.statics.authenticate = function (username, password, callback) {
  User.findOne({ username: username }).exec(function (err, user) {
    if (err) {
      return callback(err);
    } else if (!user) {
      var err = new Error("User not found.");
      err.status = 401;
      return callback(err);
    }
    bcrypt.compare(password, user.password, function (err, result) {
      if (result === true) {
        return callback(null, user);
      } else {
        return callback();
      }
    });
  });
};
```

# Views
Znotraj direktorija views je najpomembnejša datoteka [admin.hbs](../RAIN/node-backend/views/admin.hbs), v kateri celotna stran deluje.
Razdeljena je na:
- Navbar, ki te odpelje na začetno stran, ki pove kateri admin panel je to ali pa na admin panel.
```handlebars
<nav class="bg-white shadow sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-20">
        <div class="flex-shrink-0">
          <a href="/">
            <img src="/pictures/Logo.jpg" alt="Logo" class="h-16 w-auto">
          </a>
        </div>
        <div class="flex-1 flex justify-center space-x-8">
          <a href="/" class="text-black text-lg font-medium hover:text-blue-600 transition">Domov</a>
          <a href="/admin" class="text-black text-lg font-medium hover:text-blue-600 transition">Admin Panel</a>
        </div>
      </div>
    </div>
  </nav>
```

- Sidebar v katerem se izpiše spisek uporabnikov, ki so registrirani in koliko jih je aktivnih pri aktivnosti
```handlebars
<aside class="w-64 bg-white shadow-md p-6">
      <h2 class="text-xl font-semibold mb-4">Users</h2>
      <div class="mb-4 text-sm font-medium text-gray-600">
        Active Users: <span class="font-bold">{{#with users}}{{this.length}} total, {{sumActive this}}
          active{{/with}}</span>
      </div>
      <ul class="space-y-2">
        {{#each users}}
        <li class="hover:bg-gray-200 px-3 py-1 rounded cursor-pointer" data-username="{{this.username}}">
          {{this.username}}
        </li>
        {{/each}}
      </ul>
    </aside>
```
### 4 glavne sekcije admin panela
## 1. Sensors data
To je sekcija kjer se izpišejo vsi nedavni podatki iz senzorjev.
```handlebars
<section class="bg-white p-6 rounded-xl shadow w-full">
        <h2 class="text-2xl font-semibold mb-4">Podatki senzorjev</h2>
        <div class="overflow-y-auto max-h-64 border rounded-lg">
          <table class="min-w-full text-sm text-left text-gray-700">
            <thead class="bg-gray-100 text-gray-600 uppercase text-xs">
              <tr>
                <th class="px-4 py-2">ID</th>
                <th class="px-4 py-2">Uporabnik</th>
                <th class="px-4 py-2">ID aktivnosti</th>
                <th class="px-4 py-2">Datum</th>
                <th class="px-4 py-2">Koordinate</th>
                <th class="px-4 py-2">Hitrost</th>
                <th class="px-4 py-2">Različica</th>
              </tr>
            </thead>
            <tbody id="sensor-table-body">
              {{#each sensorData}}
              <tr class="border-b hover:bg-gray-50">
                <td class="px-4 py-2">{{this._id}}</td>
                <td class="px-4 py-2">{{this.user.username}}</td>
                <td class="px-4 py-2">{{this.userActivity}}</td>
                <td class="px-4 py-2">{{this.date}}</td>
                <td class="px-4 py-2">{{this.coordinates}}</td>
                <td class="px-4 py-2">{{this.speed}}</td>
                <td class="px-4 py-2">{{this.__v}}</td>
              </tr>
              {{/each}}
            </tbody>
          </table>
        </div>
      </section>
```
## 2. Zemljevid
To je sekcija kjer so na zemljevidu izpisane vse lokacije, ki so vstavljene v bazi.
Zemljevid je inicializiran s pomočjo leaflet, ki je v <script> sekciji inicializiran spodaj v datoteki.
Vključuje nekaj pomembnih funkcij kot je landmarks.forEach izpis in scrollToMap, ki premakne zemljevid na vrh strani ob kliku na landmark.
```javascript
const map = L.map('map').setView([46.0569, 14.5058], 8);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap sodelavci'
}).addTo(map);

const markerMap = {};

landmarks.forEach(lm => {
    const parts = lm.coordinates.split(',').map(s => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        const marker = L.marker(parts).addTo(map)
        .bindPopup(`<strong>${lm.name}</strong><br>${lm.category || ''}`);
        markerMap[lm.coordinates] = marker;
    }
});

function scrollToMap() {
    const mapSection = document.getElementById('map');
    mapSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

 document.querySelectorAll('#landmark-list li').forEach(item => {
    item.addEventListener('click', () => {
        const coords = item.getAttribute('data-coordinates');
        const parts = coords.split(',').map(s => parseFloat(s.trim()));
        const marker = markerMap[coords];

        if (marker && parts.length === 2) {
            map.flyTo(parts, 14, { duration: 1.2 });
            marker.openPopup();
            scrollToMap();

            document.querySelectorAll('#landmark-list li').forEach(li => li.classList.remove('bg-blue-100'));
            item.classList.add('bg-blue-100');
        }
    });
});
```
```handlebars
<section class="bg-white p-6 rounded-xl shadow">
    <h2 class="text-2xl font-semibold mb-4">Lokacije na zemljevidu</h2>
    <div id="map" class="w-full h-[500px] rounded-lg"></div>
</section>
```
## 3. Landmarks
To je sekcija v kateri se nahaja spisek vseh landmarkov v podatkovni bazi
```handlebars
<section class="bg-white p-6 rounded-xl shadow max-h-64 overflow-y-auto">
        <h2 class="text-2xl font-semibold mb-4">Landmarks</h2>
        <ul id="landmark-list" class="divide-y divide-gray-200">
          {{#each landmarks}}
          <li class="py-2 flex items-center space-x-2 text-gray-700 cursor-pointer hover:bg-gray-100 transition"
            data-coordinates="{{this.coordinates}}">
            <span class="text-red-500 text-lg">📍</span>
            <span class="font-medium">{{this.name}}</span>
            <span class="text-sm text-gray-500 ml-auto">{{this.coordinates}}</span>
          </li>
          {{/each}}
        </ul>
      </section>
```
## 4. User activities
To je sekcija kjer se izpišejo vse nedavne aktivnosti uporabnikov
```handlebars
 <section class="bg-white p-6 rounded-xl shadow max-h-64 overflow-y-auto">
        <h2 class="text-2xl font-semibold mb-4">Aktivnosti uporabnikov</h2>
        <ul class="divide-y divide-gray-200">
          {{#each userActivities}}
          <li class="py-3">
            <div class="flex items-start space-x-4">
              <div class="text-blue-500 text-xl mt-1.5">🕒</div>
              <div class="flex-1">
                <div class="flex justify-between items-center">
                  <div class="text-sm text-gray-500">{{this.date}}</div>
                  {{#if this.user}}
                  <div class="text-sm font-semibold text-gray-600">👤 {{this.user.username}}</div>
                  {{/if}}
                </div>
                <div class="mt-1 text-gray-800">
                  <span class="font-medium">Obiskano:</span>
                  <ul class="list-disc list-inside mt-1">
                    {{#each this.visited}}
                    <li class="text-gray-700">
                      {{this.landmark.name}} ob <span class="formatted-date">{{this.visitedAt}}</span>
                    </li>
                    {{/each}}
                  </ul>
                </div>
              </div>
            </div>
          </li>
          {{/each}}
        </ul>
```

Celota je zapakirana v dockerfile. Strežnik zaženemo z npm install in nato z npm run dev, ter teče na portu 3000.
