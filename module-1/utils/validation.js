// Email validation
export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

// Password validation
export const validatePassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return re.test(password);
};

// Phone number validation
export const validatePhone = (phone) => {
    const re = /^\+?[\d\s-]{10,}$/;
    return re.test(phone);
};

// Name validation
export const validateName = (name) => {
    return typeof name === 'string' && name.length >= 2 && name.length <= 50;
};

// Role validation
export const validateRole = (role, allowedRoles) => {
    return allowedRoles.includes(role);
};

// Department validation
export const validateDepartment = (department, allowedDepartments) => {
    return allowedDepartments.includes(department);
};

// Permission validation
export const validatePermissions = (permissions, allowedPermissions) => {
    if (!Array.isArray(permissions)) return false;
    return permissions.every(permission => allowedPermissions.includes(permission));
};