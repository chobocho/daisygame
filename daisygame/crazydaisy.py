import pygame
import random
import math
from daisygame.util import fileutil


def init_game():
    pygame.init()
    pygame.key.set_repeat(0)
    canvas = pygame.display.set_mode((800, 600))
    fps_clock = pygame.time.Clock()
    flowers, flowers_pos = init_flower(), calc_flower_pos(400, 300, 50)
    return canvas, fps_clock, flowers, flowers_pos

def init_flower():
    flowers = []
    for i in range(7):
        flowers.append([random.randint(1, 5) for _ in range(6)])
    return flowers

def calc_flower_pos(center_x, center_y, radius):
    flowers = []
    flowers.append([center_x, center_y, radius])

    for i in range(6):
        angle = 60 * i  # Each circle is spaced 60 degrees apart
        radians = math.radians(angle)
        x = center_x + int((radius * 3.5) * math.cos(radians))
        y = center_y + int((radius * 3.5) * math.sin(radians))
        flowers.append([x, y, radius])

    return flowers

def draw_flowers(canvas, flowers):
    canvas.fill((0, 0, 0))
    center_x = 400
    center_y = 300
    radius = 50
    small_circle_radius = 15

    draw_flower(canvas, center_x ,center_y, radius, small_circle_radius, flowers, 0)

    for i in range(6):
        angle = 60 * i  # Each circle is spaced 60 degrees apart
        radians = math.radians(angle)
        x = center_x + int((radius * 3.5) * math.cos(radians))
        y = center_y + int((radius * 3.5) * math.sin(radians))
        draw_flower(canvas, x ,y, radius, small_circle_radius, flowers, i+1)


def draw_flower(canvas, center_x, center_y, radius, small_circle_radius, flowers, flower_index):
    pygame.draw.circle(canvas, (255, 165, 0), (center_x, center_y), radius)

    COLOR_TABLE = [
        (0, 0, 0), # 0 검정
        (255, 255, 255),  # 1 흰색
        (255, 182, 193),  # 2 분홍
        (150, 123, 220),  # 3 보라
        (135, 206, 235),  # 4 하늘
        (255, 255, 0), # 5 노랑
        (255, 165, 0)  # 6 주황
    ]

    for i in range(6):
        angle = 60 * i  # Each circle is spaced 60 degrees apart
        radians = math.radians(angle)
        x = center_x + int((radius + small_circle_radius) * math.cos(radians))
        y = center_y + int((radius + small_circle_radius) * math.sin(radians))
        pygame.draw.circle(canvas, COLOR_TABLE[flowers[flower_index][i]], (x, y), small_circle_radius)


def main():
    high_score = fileutil.load_json_file("./crazydaisy.cfg", 0)
    canvas, fps_clock, flowers, flower_pos = init_game()

    leafs = [
        [0, 13], [1, 24], [2, 35], [3,40], [4, 51], [5, 62],
        [12, 25], [14, 61],
        [23, 30],
        [34, 41],
        [45, 52],
        [50, 63]
    ]
    score = 0

    version = 'CrazyDaisy ver V0.1'
    pygame.display.set_caption(version)
    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                return
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_SPACE or event.key == pygame.K_j:
                    ...
                elif event.key == pygame.K_p:
                    ...
                elif event.key == pygame.K_s:
                    ...
            if event.type == pygame.MOUSEBUTTONDOWN:
                x = event.pos[0]
                y = event.pos[1]
                for i in range(7):
                    if (x - flower_pos[i][0]) ** 2 + (y - flower_pos[i][1]) ** 2 < flower_pos[i][2] ** 2:
                        print(f'flower {i} is changed to {flowers[i]}')
                        print(f'flower 1 is changed to {flowers[1]} / score {score}')
                        flowers[i] = [flowers[i][-1]] + flowers[i][:-1]  # Right-shift the values
                        for leaf in leafs:
                            left_flower = leaf[0] // 10
                            left_flower_leaf = leaf[0] % 10
                            right_flower = leaf[1] // 10
                            right_flower_leaf = leaf[1] % 10

                            if flowers[left_flower][left_flower_leaf] == flowers[right_flower][right_flower_leaf]:
                                flowers[left_flower][left_flower_leaf] = 0
                                flowers[right_flower][right_flower_leaf] = 0
                                print(f'flower {left_flower} and {right_flower} are changed to 0')
                                score += 1
                        print(f'flower {i} is changed to {flowers[i]} / score {score}')
                        print(f'flower 1 is changed to {flowers[1]} / score {score}')

        draw_flowers(canvas, flowers)
        pygame.display.update()
        fps_clock.tick(30)


if __name__ == '__main__':
    main()