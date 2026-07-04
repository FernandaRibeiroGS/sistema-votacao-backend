import { Injectable, HttpException, HttpStatus, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Admin, AdminRole } from './entities/admin.entity';
import { LoginAdminDto } from './dto/login-admin.dto';
import { CreateAdminDto, UpdateAdminDto } from './dto/admin.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AdminService implements OnModuleInit {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  // Cria ou redefine o admin padrão para garantir que as credenciais sejam conhecidas
  async onModuleInit() {
    await this.resetDefaultAdmin();
  }

  // Redefine (ou cria) o admin padrão com as credenciais do ambiente
  async resetDefaultAdmin(): Promise<{ email: string }> {
    const defaultEmail = 'admin@votacao.com';
    const defaultPassword = this.config.get<string>('ADMIN_DEFAULT_PASSWORD', 'Admin@12345');
    const senha_hash = await bcrypt.hash(defaultPassword, 12);

    const existing = await this.adminRepository.findOne({ where: { email: defaultEmail } });

    if (existing) {
      await this.adminRepository.update(existing.id, {
        senha_hash,
        ativo: true,
        nome: 'Administrador',
        role: AdminRole.ADMIN,
      });
      this.logger.warn(`Admin padrão redefinido. E-mail: ${defaultEmail} | Senha: ${defaultPassword}`);
    } else {
      await this.adminRepository.save(
        this.adminRepository.create({
          nome: 'Administrador',
          email: defaultEmail,
          senha_hash,
          role: AdminRole.ADMIN,
        }),
      );
      this.logger.warn(`Admin padrão criado. E-mail: ${defaultEmail} | Senha: ${defaultPassword}`);
    }

    return { email: defaultEmail };
  }

  // Redefine a senha do admin padrão para uma senha conhecida
  async resetAdminPassword(password?: string): Promise<{ email: string; password: string }> {
    const defaultEmail = 'admin@votacao.com';
    const newPassword = password ?? this.config.get<string>('ADMIN_DEFAULT_PASSWORD', 'Admin@12345');
    const senha_hash = await bcrypt.hash(newPassword, 12);

    const existing = await this.adminRepository.findOne({ where: { email: defaultEmail } });

    if (existing) {
      await this.adminRepository.update(existing.id, {
        senha_hash,
        ativo: true,
        nome: 'Administrador',
        role: AdminRole.ADMIN,
      });
      this.logger.warn(`Senha do admin redefinida via endpoint. E-mail: ${defaultEmail}`);
    } else {
      await this.adminRepository.save(
        this.adminRepository.create({
          nome: 'Administrador',
          email: defaultEmail,
          senha_hash,
          role: AdminRole.ADMIN,
        }),
      );
      this.logger.warn(`Admin padrão criado via endpoint. E-mail: ${defaultEmail}`);
    }

    return { email: defaultEmail, password: newPassword };
  }

  async login(dto: LoginAdminDto, ip: string): Promise<{ token: string; admin: Partial<Admin> }> {
    const admin = await this.adminRepository.findOne({ where: { email: dto.email, ativo: true } });

    if (!admin || !(await bcrypt.compare(dto.senha, admin.senha_hash))) {
      await this.auditService.log({ acao: 'LOGIN_FALHOU', detalhes: { email: dto.email }, ip });
      throw new HttpException('Credenciais inválidas.', HttpStatus.UNAUTHORIZED);
    }

    const token = await this.jwtService.signAsync(
      { sub: admin.id, email: admin.email, role: admin.role },
      { expiresIn: '8h' },
    );

    await this.auditService.log({ adminId: admin.id, acao: 'LOGIN_SUCESSO', ip });

    const { senha_hash, ...adminData } = admin;
    return { token, admin: adminData };
  }

  async findAll(): Promise<Partial<Admin>[]> {
    const admins = await this.adminRepository.find({ order: { nome: 'ASC' } });
    return admins.map(({ senha_hash, ...a }) => a);
  }

  async create(dto: CreateAdminDto, requesterId: number, ip: string): Promise<Partial<Admin>> {
    const exists = await this.adminRepository.findOne({ where: { email: dto.email } });
    if (exists) {
      throw new HttpException('E-mail já cadastrado.', HttpStatus.CONFLICT);
    }

    const senha_hash = await bcrypt.hash(dto.senha, 12);
    const admin = await this.adminRepository.save(
      this.adminRepository.create({ ...dto, senha_hash }),
    );

    await this.auditService.log({
      adminId: requesterId,
      acao: 'ADMIN_CRIADO',
      detalhes: { email: dto.email, role: dto.role },
      ip,
    });

    const { senha_hash: _, ...adminData } = admin;
    return adminData;
  }

  async update(id: number, dto: UpdateAdminDto, requesterId: number, ip: string): Promise<Partial<Admin>> {
    const admin = await this.findOneOrFail(id);

    if (dto.senha) {
      (dto as any).senha_hash = await bcrypt.hash(dto.senha, 12);
      delete dto.senha;
    }

    Object.assign(admin, dto);
    const updated = await this.adminRepository.save(admin);

    await this.auditService.log({ adminId: requesterId, acao: 'ADMIN_ATUALIZADO', detalhes: { id }, ip });

    const { senha_hash, ...adminData } = updated;
    return adminData;
  }

  async deactivate(id: number, requesterId: number, ip: string): Promise<void> {
    if (id === requesterId) {
      throw new HttpException('Não é possível desativar sua própria conta.', HttpStatus.BAD_REQUEST);
    }
    await this.findOneOrFail(id);
    await this.adminRepository.update(id, { ativo: false });
    await this.auditService.log({ adminId: requesterId, acao: 'ADMIN_DESATIVADO', detalhes: { id }, ip });
  }

  private async findOneOrFail(id: number): Promise<Admin> {
    const admin = await this.adminRepository.findOne({ where: { id } });
    if (!admin) throw new HttpException('Usuário não encontrado.', HttpStatus.NOT_FOUND);
    return admin;
  }
}
