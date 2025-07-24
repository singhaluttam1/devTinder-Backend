# Devtinder APi

    authRouter
 	•	POST /signup
	•	POST /login
	•	POST /logout

    profileRouter
	•	GET /profile/view
	•	PATCH /profile/edit
	•	PATCH /profile/password

    connectionRequestRouter
	•	POST /request/send/:status/:userID
	•	POST /request/review/:status/:userID


	•	GET/user/Connections
	•	GET/request/received
	•	GET/feed - Geets you the profileof other users on platform


/feed?page=1&limit=10 => 1-10 => .skip(0) & limit(10)
/feed?page=2&limit=20 => 11-20 => .skip(10) & limit(10)
/feed?page=3&limit=30 => 21-30 => .skip(20) & limit(10)



Status: ignore, interested, accepted, rejected
