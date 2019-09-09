module.exports =(pool) => {
    isLoggedIn: (req, res, next) => {
        if (req.pmsdb.user) {
            next()
        }else{
            res.redirect('/login')
        }
    }
}