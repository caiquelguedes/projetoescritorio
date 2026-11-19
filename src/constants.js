const PERFIL = {
  DISCENTE: 'discente',
  DOCENTE: 'docente',
  SERVIDOR: 'servidor',
  CAEX: 'caex',
  ADMINISTRADOR: 'administrador',
}

const STATUS_PROJETO = {
  DISPONIVEL: 'Disponível',
  EM_ANDAMENTO: 'Em andamento',
  AGUARDANDO_RETORNO: 'Aguardando retorno',
  CONCLUIDO: 'Concluído',
}

const STATUS_INSCRICAO = {
  EM_CONTATO: 'em contato',
  EM_ANDAMENTO: 'em andamento',
  AGUARDANDO_RETORNO: 'aguardando retorno',
  CONCLUIDA: 'concluída',
}

const PERFIS_GESTORES = [PERFIL.CAEX, PERFIL.ADMINISTRADOR]
const PERFIS_COORDENADORES = [PERFIL.DOCENTE, PERFIL.SERVIDOR]

module.exports = {
  PERFIL,
  STATUS_PROJETO,
  STATUS_INSCRICAO,
  PERFIS_GESTORES,
  PERFIS_COORDENADORES,
}
