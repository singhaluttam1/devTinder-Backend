const validator=require('validator')

const validateSignUpData = (req) => {
    const { firstName, lastName, emailID, password } = req.body
    if (!firstName) {
        throw new Error(":Name is not Vaild!")

    }
    else if(firstName.length <4 || firstName.length >50){
        throw new Error("FirstName Should be 4-50 characters")
    }
    else if(!validator.isEmail(emailID)){
        throw new Error("Email is not valid")
    }
    else if(!validator.isStrongPassword(password)){
        throw new Error("Password is not strong")
    }
}
const validateEditProfileData=(req)=>{
    const allowedEditFields=["firstName","lastName","emailID","gender","about","skills","photourl","age"]
    const isEditAllowed=Object.keys(req.body).every(field=>
        allowedEditFields.includes(field)
        )
    return isEditAllowed


}
const validatePassword=(req)=>{
    const oldPassword=["passowrd"]

}
module.exports={validateSignUpData,validateEditProfileData}