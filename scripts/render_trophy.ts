// Renders svg/trophy.svg with ryo-ma/github-profile-trophy, cloned into
// .trophy-gen by the workflow.
//
// Upstream ships its own render_svg.ts, but that entrypoint only takes
// positional arguments (username, output path, theme) and hardcodes the layout
// (auto columns, frames on). This wrapper drives the same Card renderer so the
// layout stays configurable from the workflow.
import { Card } from "../.trophy-gen/src/card.ts";
import { COLORS } from "../.trophy-gen/src/theme.ts";
import { GithubApiService } from "../.trophy-gen/src/Services/GithubApiService.ts";

const args = Deno.args;
const username = args[0];

if (!username || username.startsWith("-")) {
  console.error(
    "Usage: deno run --allow-net --allow-env --allow-read --allow-write " +
      "scripts/render_trophy.ts USERNAME [--file PATH] [--theme NAME] " +
      "[--cols N] [--rows N] [--panel-size N] [--margin-width N] " +
      "[--margin-height N] [--no-frame] [--no-bg]",
  );
  Deno.exit(1);
}

function stringArg(name: string, fallback: string): string {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const value = args[i + 1];
  if (value === undefined || value.startsWith("--")) {
    console.error(`Missing value for --${name}`);
    Deno.exit(1);
  }
  return value;
}

function numberArg(name: string, fallback: number): number {
  const raw = stringArg(name, String(fallback));
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    console.error(`Invalid number for --${name}: ${raw}`);
    Deno.exit(1);
  }
  return value;
}

const flag = (name: string): boolean => args.includes(`--${name}`);

const outputPath = stringArg("file", "./svg/trophy.svg");
const themeName = stringArg("theme", "default");
const maxColumn = numberArg("cols", -1);
const maxRow = numberArg("rows", 3);
const panelSize = numberArg("panel-size", 115);
const marginWidth = numberArg("margin-width", 0);
const marginHeight = numberArg("margin-height", 0);
const noFrame = flag("no-frame");
const noBackground = flag("no-bg");

console.log("Starting trophy render...");
console.log("Username:", username);
console.log("Output path:", outputPath);
console.log("Theme:", themeName);
console.log("Columns:", maxColumn, "Rows:", maxRow, "Panel size:", panelSize);

const service = new GithubApiService();
const userInfo = await service.requestUserInfo(username);

if (!userInfo || (userInfo as any).totalCommits === undefined) {
  console.error(
    "Failed to fetch user info. Check token, username and rate limits.",
  );
  Deno.exit(2);
}

const theme = (COLORS as any)[themeName] ?? (COLORS as any).default;
const svg = new Card(
  [],
  [],
  maxColumn,
  maxRow,
  panelSize,
  marginWidth,
  marginHeight,
  noBackground,
  noFrame,
).render(userInfo as any, theme);

const dir = outputPath.replace(/\/[^/]+$/, "");
if (dir && dir !== outputPath) {
  await Deno.mkdir(dir, { recursive: true });
}

await Deno.writeTextFile(outputPath, svg);
console.log(`Wrote ${outputPath}`);
