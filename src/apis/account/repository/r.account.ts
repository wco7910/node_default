import { Account } from '../entity/e.account';
import { g_DataSource } from '../../../serverInit/database';

export const accountRepository = g_DataSource?.getRepository(Account).extend({
  async getCenterTrainer(centerId) {
    return await accountRepository
      .createQueryBuilder('account')
      .leftJoin('account.center', 'center')
      .select('account.id', 'account_id')
      .addSelect('account.name', 'account_name')
      .addSelect('account.email', 'account_email')
      .addSelect('center.name', 'center_name')
      .addSelect('account.createdAt', 'created_at')
      .addSelect('account.isValid', 'is_valid')
      .addSelect(
        (s) =>
          s
            .select('COUNT(tempo)')
            .from('tempo', 'tempo')
            .where('tempo.currentOwner = account.id'),
        'tempo_count'
      )
      .addSelect(
        (s) =>
          s
            .select('COUNT(sequence)')
            .from('sequence', 'sequence')
            .where('sequence.currentOwner = account.id'),
        'sequence_count'
      )
      .addSelect(
        (s) =>
          s
            .select('COUNT(lecture)')
            .from('lecture', 'lecture')
            .where('lecture.currentOwner = account.id'),
        'lecture_count'
      )
      .addSelect((s) =>
        s
          .select('file.id', 'photo_key')
          .from('file', 'file')
          .where('file.serviceId = account.id::TEXT')
          .andWhere('file.service =:service', { service: 'profile' })
          .andWhere('file.isUsed =:status', { status: 'T' })
          .limit(1)
      )
      .addSelect((s) =>
        s
          .select('file.path', 'photo_path')
          .from('file', 'file')
          .where('file.serviceId = account.id::TEXT')
          .andWhere('file.service =:service', { service: 'profile' })
          .andWhere('file.isUsed =:status', { status: 'T' })
          .limit(1)
      )
      .addSelect((s) =>
        s
          .select('file.ext', 'photo_ext')
          .from('file', 'file')
          .where('file.serviceId = account.id::TEXT')
          .andWhere('file.service =:service', { service: 'profile' })
          .andWhere('file.isUsed =:status', { status: 'T' })
          .limit(1)
      )
      .where('center.id =:centerId', { centerId: centerId })
      .andWhere('account.role =:role', { role: 'trainer' })
      .getRawMany();
  },
});
