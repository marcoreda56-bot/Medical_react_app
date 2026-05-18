import axiosInstance from "./axios";

// export const registerUser = async (userData) => {
//   const res = await axiosInstance.post("/users", userData);
//   return res.data;
// };

export const registerUser = async (userData) => {
    const checkRes = await axiosInstance.get(`/users?email=${userData.email}`);
    if (checkRes.data.length > 0) {
        throw new Error("Email already exists");
    }
    const res = await axiosInstance.post("/users", userData);
    return res.data;
};

export const loginUser = async (email, password) => {
  const res = await axiosInstance.get("/users");

  const user = res.data.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) {
    throw new Error("Invalid email or password");
  }

  return user;
};





// import axiosInstance from "./axios";







// export const loginUser = async (email, password) => {

//     const res = await axiosInstance.get(`/users?email=${email}&password=${password}`);

    

//     if (res.data.length === 0) {

//         throw new Error("Invalid email or password");

//     }

    

//     return res.data[0]; 

// }; 