export class UpdateAdminDto {
  email: string;
  password: string;
  name: string;
  constructor(data) {
    this.email = data.email;
    this.password = data.password;
    this.name = data.name;
  }
}
