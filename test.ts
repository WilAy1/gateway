type User = {
    name: String,
    age: number
}

function callUser(user: User) : String {
    return user.name + " is " + user.age + "years old."; 
}


const a_user : User = {
    name: "Ayomikun",
    age: 19
}

console.log(callUser(a_user))