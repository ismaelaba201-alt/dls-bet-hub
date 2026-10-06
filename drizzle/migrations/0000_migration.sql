CREATE TABLE public.game_codes (
  code text PRIMARY KEY,
  matches jsonb NOT NULL,
  results jsonb,
  result_image text,
  results_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.bet_codes (
  code text PRIMARY KEY,
  game_code text NOT NULL REFERENCES public.game_codes(code) ON DELETE CASCADE,
  legs jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.game_codes TO service_role;
GRANT ALL ON public.bet_codes TO service_role;
ALTER TABLE public.game_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bet_codes ENABLE ROW LEVEL SECURITY;