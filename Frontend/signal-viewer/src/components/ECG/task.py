# # FUNCTION MIN_REFILLS(D, L, S)
# PATH = [0] + S + [D]
# R = 0
# C = 0

# # WHILE C < LENGTH(PATH) - 1:
# LRI = C
# # WHILE (C < LENGTH(PATH) - 1) AND (PATH[C + 1] - PATH[LRI] <= L):
# C = C + 1

# IF C == LRI:
#   RETURN -1

# IF C < LENGTH(PATH) - 1:
#   R = R + 1
# RETURN R