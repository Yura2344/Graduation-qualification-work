export default function verifySession (req, res, next) {
    if(req.session.userId)
        next();
    else
        return res.status(401).send("You are not logged in");
}