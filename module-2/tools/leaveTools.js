
import LeaveRequest from "../models/LeaveRequest.js";
import LeaveBalance from "../models/LeaveBalance.js";
import {
  createRecord,
  getById,
  findRecords,
  updateRecord,
  deleteRecord
} from "./base/crudTools.js";

export const createLeaveRequest = (data) =>
  createRecord(LeaveRequest, data);

export const listLeaveRequests = (filter, options) =>
  findRecords(LeaveRequest, filter, options);

export const updateLeaveRequest = (id, data) =>
  updateRecord(LeaveRequest, id, data);

export const deleteLeaveRequest = (id) =>
  deleteRecord(LeaveRequest, id);

export const getLeaveBalance = (employeeId, year) =>
  LeaveBalance.findOne({ employeeId, year });

export const updateLeaveBalance = (id, data) =>
  updateRecord(LeaveBalance, id, data);
