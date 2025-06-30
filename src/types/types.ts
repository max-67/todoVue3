export interface ITask {
  id: string;
  title: string;
  status: string;
  tags: string[];
  subtasks: ITask[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IProject {
  id: string;
  name: string;
  tasks: ITask[];
}

interface ISettingsFilters {
  search: string,
  statuses: string[],
  tags: string[]
}

export interface ISettings {
  projects: IProject[],
  filters: ISettingsFilters
}