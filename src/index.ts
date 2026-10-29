
import { McpServer } from "@modelcontextprotocol/server";
import { createMcpHandler } from "agents/mcp/server";
import { z } from "zod";

const generators = [
  {
    id: "runway",
    name: "Runway",
    capabilities: ["text-to-video", "image-to-video"],
    status: "not_configured",
    note: "API et accès gratuit à vérifier avant toute génération.",
  },
  {
    id: "cloudflare-ai",
    name: "Cloudflare Workers AI",
    capabilities: ["image", "text", "media-models-subject-to-availability"],
    status: "not_configured",
    note: "Vérifier les modèles vidéo réellement disponibles et les limites du compte.",
  },
  {
    id: "other-api",
    name: "Autres générateurs compatibles API",
    capabilities: ["text-to-video", "image-to-video"],
    status: "not_configured",
    note: "À ajouter après vérification de l'API, du coût et des conditions d'accès.",
  },
];

function createServer() {
  const server = new McpServer({
    name: "Video Generator Hub",
    version: "1.0.0",
  });

  server.registerTool(
    "list_video_generators",
    {
      description:
        "Liste les générateurs vidéo connus, leurs capacités déclarées et leur statut de configuration. Ne lance aucune génération.",
      inputSchema: z.object({}),
    },
    async () => ({
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(generators, null, 2),
        },
      ],
    }),
  );

  server.registerTool(
    "recommend_video_generator",
    {
      description:
        "Recommande un générateur selon le type de création demandé. N'affirme pas qu'une génération est possible si le service n'est pas configuré.",
      inputSchema: z.object({
        task: z.enum([
          "text-to-video",
          "image-to-video",
          "video-editing",
        ]),
        freeOnly: z.boolean().default(true),
      }),
    },
    async ({ task, freeOnly }) => {
      const candidates = generators.filter((generator) =>
        generator.capabilities.includes(task),
      );

      const result = {
        requestedTask: task,
        freeOnly,
        recommendation: null as string | null,
        status: "no_verified_ready_generator",
        candidates: candidates.map((generator) => ({
          name: generator.name,
          status: generator.status,
          note: generator.note,
        })),
        message:
          "Aucun générateur n'est encore configuré et vérifié comme gratuit. Vérifier les API et les tarifs avant de lancer une génération.",
      };

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  return server;
}

const handler = createMcpHandler(createServer);

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return handler(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
