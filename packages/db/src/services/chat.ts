import { prisma } from "./prisma";

export async function getUserConversations(userId: string, opts?: { page?: number; limit?: number; search?: string }) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;

  const [memberships, total] = await Promise.all([
    prisma.conversationMember.findMany({
      where: {
        userId,
        ...(opts?.search ? {
          conversation: {
            members: {
              some: {
                user: {
                  name: { contains: opts.search, mode: "insensitive" },
                },
                userId: { not: userId },
              },
            },
          },
        } : {}),
      },
      include: {
        conversation: {
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              include: { sender: { select: { id: true, name: true } } },
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: "desc" } },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.conversationMember.count({
      where: {
        userId,
        ...(opts?.search ? {
          conversation: {
            members: {
              some: {
                user: {
                  name: { contains: opts.search, mode: "insensitive" },
                },
                userId: { not: userId },
              },
            },
          },
        } : {}),
      },
    }),
  ]);

  const items = memberships.map((m) => ({
    id: m.conversation.id,
    name: m.conversation.name,
    members: m.conversation.members.map((mem) => ({
      id: mem.user.id,
      name: mem.user.name,
      email: mem.user.email,
    })),
    lastMessage: m.conversation.messages[0]
      ? {
          id: m.conversation.messages[0].id,
          text: m.conversation.messages[0].text,
          senderName: m.conversation.messages[0].sender.name,
          timestamp: m.conversation.messages[0].createdAt,
        }
      : null,
    updatedAt: m.conversation.updatedAt,
  }));

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getConversationMessages(conversationId: string, userId: string, opts?: { page?: number; limit?: number }) {
  const membership = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!membership) throw new Error("Not a member of this conversation");

  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId },
      include: { sender: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.message.count({ where: { conversationId } }),
  ]);

  const items = messages.map((m) => ({
    id: m.id,
    senderId: m.senderId,
    senderName: m.sender.name,
    text: m.text,
    timestamp: m.createdAt,
  }));

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function sendMessage(conversationId: string, senderId: string, text: string) {
  const membership = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId: senderId } },
  });
  if (!membership) throw new Error("Not a member of this conversation");

  const message = await prisma.message.create({
    data: { conversationId, senderId, text },
    include: { sender: { select: { id: true, name: true } } },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return {
    id: message.id,
    senderId: message.senderId,
    senderName: message.sender.name,
    text: message.text,
    timestamp: message.createdAt,
  };
}

export async function createConversation(name: string | null, memberIds: string[]) {
  const conversation = await prisma.conversation.create({
    data: {
      name,
      members: {
        create: memberIds.map((userId) => ({ userId })),
      },
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  return {
    id: conversation.id,
    name: conversation.name,
    members: conversation.members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
    })),
  };
}

export async function getOrCreateConversation(userId1: string, userId2: string) {
  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { members: { some: { userId: userId1 } } },
        { members: { some: { userId: userId2 } } },
      ],
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  if (existing) {
    return {
      id: existing.id,
      name: existing.name,
      members: existing.members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
      })),
    };
  }

  return createConversation(null, [userId1, userId2]);
}
