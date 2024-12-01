import { Base } from '#/@types/entity/base.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  Relation,
  RelationId,
  Unique,
} from 'typeorm';

@Entity()
@Unique(['email'])
@Unique(['phone'])
export class Account extends Base {
  @Column({
    comment: '로그인에 사용할 이메일 ',
  })
  email: string;

  @Column({
    select: false,
    comment: '로그인에 사용할 비밀번호',
  })
  password: string;

  @Column({
    comment: '회원 or 관리자의 이름',
  })
  name: string;

  @Column({
    comment: '회원사의 통신사 정보',
  })
  carrier: string;

  @Column({
    comment: '회원의 핸드폰 번호',
  })
  phone: string;

  @Column({
    comment: 'Admin, Center, Trainer로 나뉘는 권한',
  })
  role: string;

  @Column({
    nullable: true,
    comment: '앱 푸시를 위한 firebase token 을 저장하는 컬럼',
  })
  firebaseToken: string;

  @Column({
    comment: '해당 회원의 경고 상태를 표시한다, 1차 개발에서는 기능 적용 X',
    default: '0',
  })
  isValid: number;

  @Column({
    comment: 'refreshToken 을 담아 중복 로그인을 차단할 영역',
    nullable: true,
  })
  refreshToken: string;

  @Column('simple-json', {
    comment: '따로 지정하 불명확한 정보들을 위한 컬럼',
    nullable: true,
  })
  etc: string;

}
