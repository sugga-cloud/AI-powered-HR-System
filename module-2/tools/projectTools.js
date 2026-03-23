
import Project from "../models/Project.js";
import ProjectAssignment from "../models/ProjectAssignment.js";
import {
  createRecord,
  getById,
  findRecords,
  updateRecord,
  deleteRecord,
  searchRecords
} from "./base/crudTools.js";

export const createProject = (data) =>
  createRecord(Project, data);

export const getProjectById = (id) =>
  getById(Project, id, ["projectLeadId","departmentId"]);

export const listProjects = (filter, options) =>
  findRecords(Project, filter, options);

export const updateProject = (id, data) =>
  updateRecord(Project, id, data);

export const deleteProject = (id) =>
  deleteRecord(Project, id);

export const searchProjects = (keyword) =>
  searchRecords(Project, ["name"], keyword);

export const assignEmployeeToProject = (data) =>
  createRecord(ProjectAssignment, data);

export const listProjectAssignments = (filter, options) =>
  findRecords(ProjectAssignment, filter, options);
